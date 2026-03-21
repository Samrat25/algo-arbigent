"""
Opt-in to the vault contract
This must be done before depositing tokens
"""

import algosdk
from algosdk.v2client.algod import AlgodClient
from algosdk import transaction
import os
from dotenv import load_dotenv

load_dotenv()
if not os.getenv('FAUCET_MNEMONIC'):
    load_dotenv('../backend/.env')

# Algorand configuration
ALGOD_TOKEN = ''
ALGOD_SERVER = 'https://testnet-api.algonode.cloud'
ALGOD_PORT = ''

algod_client = AlgodClient(ALGOD_TOKEN, ALGOD_SERVER, ALGOD_PORT)

# Load configuration
FAUCET_MNEMONIC = os.getenv('FAUCET_MNEMONIC')
APP_ID = int(os.getenv('APP_ID', '0'))

if not FAUCET_MNEMONIC:
    raise Exception("FAUCET_MNEMONIC not set in .env file")

if APP_ID == 0:
    raise Exception("APP_ID not set in .env file")

faucet_account = algosdk.mnemonic.to_private_key(FAUCET_MNEMONIC)
faucet_address = algosdk.account.address_from_private_key(faucet_account)

print(f"✅ Account: {faucet_address}")
print(f"📱 App ID: {APP_ID}")


def check_opted_in():
    """Check if already opted in"""
    try:
        account_info = algod_client.account_info(faucet_address)
        apps = account_info.get('apps-local-state', [])
        for app in apps:
            if app['id'] == APP_ID:
                return True
        return False
    except Exception as e:
        print(f"Error checking opt-in status: {e}")
        return False


def optin_to_vault():
    """Opt-in to the vault contract"""
    try:
        print(f"\n🔧 Opting into Vault contract...")
        
        # Get suggested params
        params = algod_client.suggested_params()
        
        # Create app opt-in transaction
        txn = transaction.ApplicationOptInTxn(
            sender=faucet_address,
            sp=params,
            index=APP_ID
        )
        
        # Sign transaction
        signed_txn = txn.sign(faucet_account)
        
        # Send transaction
        tx_id = algod_client.send_transaction(signed_txn)
        
        # Wait for confirmation
        confirmed_txn = transaction.wait_for_confirmation(algod_client, tx_id, 4)
        
        print(f"✅ Opted into Vault successfully!")
        print(f"   Transaction ID: {tx_id}")
        print(f"   Confirmed in round: {confirmed_txn['confirmed-round']}")
        
        return tx_id
        
    except Exception as e:
        print(f"❌ Error opting in: {e}")
        raise


if __name__ == "__main__":
    print("=" * 60)
    print("Vault Contract Opt-in")
    print("=" * 60)
    
    # Check if already opted in
    if check_opted_in():
        print(f"\n✅ Already opted into Vault contract!")
        print(f"   No action needed.")
    else:
        print(f"\n⚠️  Not opted into Vault contract")
        print(f"   Opting in now...")
        optin_to_vault()
    
    print("\n" + "=" * 60)
    print("You can now deposit tokens to the vault!")
    print("=" * 60)
