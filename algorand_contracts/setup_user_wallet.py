"""
Setup user wallet for vault operations:
1. Opt-in to USDC and USDT assets
2. Fund with initial tokens for testing
3. Opt-in to the vault contract
"""

import algosdk
from algosdk.v2client.algod import AlgodClient
from algosdk import transaction
import os
from dotenv import load_dotenv
import sys

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
USDC_ASSET_ID = int(os.getenv('USDC_ASSET_ID', '0'))
USDT_ASSET_ID = int(os.getenv('USDT_ASSET_ID', '0'))

if not FAUCET_MNEMONIC:
    raise Exception("FAUCET_MNEMONIC not set in .env file")

faucet_account = algosdk.mnemonic.to_private_key(FAUCET_MNEMONIC)
faucet_address = algosdk.account.address_from_private_key(faucet_account)


def check_asset_opted_in(address, asset_id):
    """Check if an address has opted into an asset"""
    try:
        account_info = algod_client.account_info(address)
        assets = account_info.get('assets', [])
        for asset in assets:
            if asset['asset-id'] == asset_id:
                return True, asset.get('amount', 0)
        return False, 0
    except Exception as e:
        print(f"Error checking opt-in status: {e}")
        return False, 0


def check_app_opted_in(address, app_id):
    """Check if an address has opted into an app"""
    try:
        account_info = algod_client.account_info(address)
        apps = account_info.get('apps-local-state', [])
        for app in apps:
            if app['id'] == app_id:
                return True
        return False
    except Exception as e:
        print(f"Error checking app opt-in status: {e}")
        return False


def send_tokens_to_user(user_address, asset_id, amount, token_name):
    """Send tokens from faucet to user"""
    try:
        print(f"\n💸 Sending {amount / 1000000} {token_name} to user...")
        
        params = algod_client.suggested_params()
        
        txn = transaction.AssetTransferTxn(
            sender=faucet_address,
            sp=params,
            receiver=user_address,
            amt=amount,
            index=asset_id
        )
        
        signed_txn = txn.sign(faucet_account)
        tx_id = algod_client.send_transaction(signed_txn)
        
        transaction.wait_for_confirmation(algod_client, tx_id, 4)
        
        print(f"✅ Sent {amount / 1000000} {token_name} successfully!")
        print(f"   Transaction ID: {tx_id}")
        
        return tx_id
        
    except Exception as e:
        print(f"❌ Error sending {token_name}: {e}")
        return None


def setup_user_wallet(user_address):
    """Complete setup for a user wallet"""
    print("=" * 70)
    print(f"Setting up wallet: {user_address}")
    print("=" * 70)
    
    # Check USDC opt-in
    print("\n🔍 Checking USDC opt-in status...")
    usdc_opted_in, usdc_balance = check_asset_opted_in(user_address, USDC_ASSET_ID)
    if usdc_opted_in:
        print(f"✅ Already opted into USDC (Balance: {usdc_balance / 1000000})")
    else:
        print(f"⚠️  Not opted into USDC (Asset ID: {USDC_ASSET_ID})")
        print(f"   User must opt-in from their wallet first!")
    
    # Check USDT opt-in
    print("\n🔍 Checking USDT opt-in status...")
    usdt_opted_in, usdt_balance = check_asset_opted_in(user_address, USDT_ASSET_ID)
    if usdt_opted_in:
        print(f"✅ Already opted into USDT (Balance: {usdt_balance / 1000000})")
    else:
        print(f"⚠️  Not opted into USDT (Asset ID: {USDT_ASSET_ID})")
        print(f"   User must opt-in from their wallet first!")
    
    # Check app opt-in
    print("\n🔍 Checking Vault contract opt-in status...")
    app_opted_in = check_app_opted_in(user_address, APP_ID)
    if app_opted_in:
        print(f"✅ Already opted into Vault contract")
    else:
        print(f"⚠️  Not opted into Vault contract (App ID: {APP_ID})")
        print(f"   User must opt-in from the frontend!")
    
    # Send tokens if opted in and balance is low
    if usdc_opted_in and usdc_balance < 100_000000:  # Less than 100 USDC
        send_tokens_to_user(user_address, USDC_ASSET_ID, 100_000000, "USDC")
    
    if usdt_opted_in and usdt_balance < 100_000000:  # Less than 100 USDT
        send_tokens_to_user(user_address, USDT_ASSET_ID, 100_000000, "USDT")
    
    print("\n" + "=" * 70)
    print("Setup Summary:")
    print("=" * 70)
    print(f"USDC Opt-in: {'✅' if usdc_opted_in else '❌'}")
    print(f"USDT Opt-in: {'✅' if usdt_opted_in else '❌'}")
    print(f"Vault Opt-in: {'✅' if app_opted_in else '❌'}")
    print("=" * 70)
    
    if not usdc_opted_in or not usdt_opted_in:
        print("\n📝 Next Steps:")
        print("1. Open your Algorand wallet (Pera, Defly, etc.)")
        print("2. Go to 'Add Asset' or 'Opt-in to Asset'")
        if not usdc_opted_in:
            print(f"3. Add USDC (Asset ID: {USDC_ASSET_ID})")
        if not usdt_opted_in:
            print(f"4. Add USDT (Asset ID: {USDT_ASSET_ID})")
        print("5. Run this script again to receive test tokens")
    
    if not app_opted_in:
        print("\n📝 Vault Opt-in:")
        print("1. Go to the frontend Vault page")
        print("2. Click 'Opt-in to Vault' button")
        print("3. Approve the transaction in your wallet")


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python setup_user_wallet.py <user_address>")
        print("Example: python setup_user_wallet.py ABC123XYZ...")
        sys.exit(1)
    
    user_addr = sys.argv[1]
    
    if not algosdk.encoding.is_valid_address(user_addr):
        print(f"❌ Invalid Algorand address: {user_addr}")
        sys.exit(1)
    
    setup_user_wallet(user_addr)
