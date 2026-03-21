"""
Set USDC and USDT asset IDs in the vault contract
This must be done before users can deposit these tokens
"""

import algosdk
from algosdk.v2client.algod import AlgodClient
from algosdk import transaction
import os
from dotenv import load_dotenv

load_dotenv()

# Try loading from parent backend directory if not found
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

if APP_ID == 0:
    raise Exception("APP_ID not set in .env file")

faucet_account = algosdk.mnemonic.to_private_key(FAUCET_MNEMONIC)
faucet_address = algosdk.account.address_from_private_key(faucet_account)

print(f"✅ Faucet Address: {faucet_address}")
print(f"📱 App ID: {APP_ID}")
print(f"💵 USDC Asset ID: {USDC_ASSET_ID}")
print(f"💵 USDT Asset ID: {USDT_ASSET_ID}")


def set_asset_id(asset_type, asset_id):
    """
    Set USDC or USDT asset ID in the contract
    
    Args:
        asset_type: 'usdc' or 'usdt'
        asset_id: The asset ID to set
    """
    try:
        print(f"\n🔧 Setting {asset_type.upper()} asset ID to {asset_id}...")
        
        # Get suggested params
        params = algod_client.suggested_params()
        
        # Create app call transaction
        txn = transaction.ApplicationNoOpTxn(
            sender=faucet_address,
            sp=params,
            index=APP_ID,
            app_args=[
                f"set_{asset_type}".encode(),
                asset_id.to_bytes(8, 'big')
            ]
        )
        
        # Sign transaction
        signed_txn = txn.sign(faucet_account)
        
        # Send transaction
        tx_id = algod_client.send_transaction(signed_txn)
        
        # Wait for confirmation
        confirmed_txn = transaction.wait_for_confirmation(algod_client, tx_id, 4)
        
        print(f"✅ Set {asset_type.upper()} asset ID successfully!")
        print(f"   Transaction ID: {tx_id}")
        print(f"   Confirmed in round: {confirmed_txn['confirmed-round']}")
        
        return tx_id
        
    except Exception as e:
        print(f"❌ Error setting {asset_type.upper()} asset ID: {e}")
        raise


def verify_asset_ids():
    """
    Verify that asset IDs are set correctly in the contract
    """
    try:
        print(f"\n🔍 Verifying asset IDs in contract...")
        
        app_info = algod_client.application_info(APP_ID)
        global_state = app_info['params'].get('global-state', [])
        
        usdc_id = 0
        usdt_id = 0
        
        for item in global_state:
            key = algosdk.encoding.base64.b64decode(item['key']).decode('utf-8')
            if key == 'usdc_asset_id':
                usdc_id = item['value']['uint']
            elif key == 'usdt_asset_id':
                usdt_id = item['value']['uint']
        
        print(f"\n📊 Current Contract State:")
        print(f"   USDC Asset ID: {usdc_id} (expected: {USDC_ASSET_ID})")
        print(f"   USDT Asset ID: {usdt_id} (expected: {USDT_ASSET_ID})")
        
        if usdc_id == USDC_ASSET_ID and usdt_id == USDT_ASSET_ID:
            print(f"\n✅ All asset IDs are correctly set!")
            return True
        else:
            print(f"\n⚠️  Asset IDs don't match expected values")
            return False
        
    except Exception as e:
        print(f"❌ Error verifying asset IDs: {e}")
        return False


if __name__ == "__main__":
    print("=" * 60)
    print("Setting Asset IDs in Vault Contract")
    print("=" * 60)
    
    # Set USDC asset ID
    if USDC_ASSET_ID > 0:
        set_asset_id('usdc', USDC_ASSET_ID)
    else:
        print("⚠️  USDC_ASSET_ID not set in .env, skipping...")
    
    # Set USDT asset ID
    if USDT_ASSET_ID > 0:
        set_asset_id('usdt', USDT_ASSET_ID)
    else:
        print("⚠️  USDT_ASSET_ID not set in .env, skipping...")
    
    # Verify
    print("\n" + "=" * 60)
    verify_asset_ids()
    print("=" * 60)
