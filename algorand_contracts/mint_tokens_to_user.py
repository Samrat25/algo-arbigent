"""
Script to mint vault tokens to users when they deposit
This allows users to see tokens in their wallet instead of just contract balances
"""

import algosdk
from algosdk.v2client import algod
from algosdk import transaction
import os
from dotenv import load_dotenv

load_dotenv()

# Algorand configuration
ALGOD_TOKEN = ''
ALGOD_SERVER = 'https://testnet-api.algonode.cloud'
ALGOD_PORT = ''

algod_client = algosdk.algodv2.Algodv2(ALGOD_TOKEN, ALGOD_SERVER, ALGOD_PORT)

# Load configuration
FAUCET_MNEMONIC = os.getenv('FAUCET_MNEMONIC')
USDC_ASSET_ID = int(os.getenv('USDC_ASSET_ID', '0'))
USDT_ASSET_ID = int(os.getenv('USDT_ASSET_ID', '0'))

if not FAUCET_MNEMONIC:
    raise Exception("FAUCET_MNEMONIC not set in .env file")

faucet_account = algosdk.mnemonic.to_private_key(FAUCET_MNEMONIC)
faucet_address = algosdk.account.address_from_private_key(faucet_account)

print(f"✅ Faucet Address: {faucet_address}")
print(f"💵 USDC Asset ID: {USDC_ASSET_ID}")
print(f"💵 USDT Asset ID: {USDT_ASSET_ID}")


def mint_tokens_to_user(user_address, asset_id, amount):
    """
    Mint (transfer) tokens to a user's wallet
    
    Args:
        user_address: The user's Algorand address
        asset_id: The ASA ID to transfer
        amount: Amount in base units (microAlgos/microTokens)
    
    Returns:
        Transaction ID if successful
    """
    try:
        # Get suggested params
        params = algod_client.suggested_params()
        
        # Create asset transfer transaction
        txn = transaction.AssetTransferTxn(
            sender=faucet_address,
            sp=params,
            receiver=user_address,
            amt=amount,
            index=asset_id
        )
        
        # Sign transaction
        signed_txn = txn.sign(faucet_account)
        
        # Send transaction
        tx_id = algod_client.send_transaction(signed_txn)
        
        # Wait for confirmation
        confirmed_txn = transaction.wait_for_confirmation(algod_client, tx_id, 4)
        
        print(f"✅ Minted {amount / 1000000} tokens to {user_address}")
        print(f"   Transaction ID: {tx_id}")
        print(f"   Confirmed in round: {confirmed_txn['confirmed-round']}")
        
        return tx_id
        
    except Exception as e:
        print(f"❌ Error minting tokens: {e}")
        raise


def burn_tokens_from_user(user_address, asset_id, amount):
    """
    This would require the user to send tokens back to the faucet/vault
    The actual burning would be done by the user's wallet
    """
    print(f"ℹ️  User should send {amount / 1000000} tokens back to vault")
    print(f"   Vault address: {faucet_address}")
    return True


if __name__ == "__main__":
    # Example usage
    import sys
    
    if len(sys.argv) < 4:
        print("Usage: python mint_tokens_to_user.py <user_address> <token_symbol> <amount>")
        print("Example: python mint_tokens_to_user.py ABC...XYZ USDC 100")
        sys.exit(1)
    
    user_addr = sys.argv[1]
    token_symbol = sys.argv[2].upper()
    amount_tokens = float(sys.argv[3])
    
    # Convert to micro units
    amount_micro = int(amount_tokens * 1000000)
    
    # Get asset ID
    if token_symbol == 'USDC':
        asset_id = USDC_ASSET_ID
    elif token_symbol == 'USDT':
        asset_id = USDT_ASSET_ID
    else:
        print(f"❌ Unknown token: {token_symbol}")
        sys.exit(1)
    
    # Mint tokens
    mint_tokens_to_user(user_addr, asset_id, amount_micro)
