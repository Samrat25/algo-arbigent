"""
Complete setup checker - verifies everything is ready
"""

import algosdk
from algosdk.v2client.algod import AlgodClient
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
    print("❌ FAUCET_MNEMONIC not set in .env file")
    sys.exit(1)

faucet_account = algosdk.mnemonic.to_private_key(FAUCET_MNEMONIC)
faucet_address = algosdk.account.address_from_private_key(faucet_account)


def check_contract_asset_ids():
    """Check if contract has asset IDs set"""
    try:
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
        
        usdc_ok = usdc_id == USDC_ASSET_ID
        usdt_ok = usdt_id == USDT_ASSET_ID
        
        return usdc_ok, usdt_ok, usdc_id, usdt_id
    except Exception as e:
        print(f"Error checking contract: {e}")
        return False, False, 0, 0


def check_user_opted_in(address):
    """Check if user has opted into vault and assets"""
    try:
        account_info = algod_client.account_info(address)
        
        # Check app opt-in
        apps = account_info.get('apps-local-state', [])
        app_opted_in = any(app['id'] == APP_ID for app in apps)
        
        # Check asset opt-ins
        assets = account_info.get('assets', [])
        usdc_opted_in = any(asset['asset-id'] == USDC_ASSET_ID for asset in assets)
        usdt_opted_in = any(asset['asset-id'] == USDT_ASSET_ID for asset in assets)
        
        # Get balances
        algo_balance = account_info['amount'] / 1_000_000
        usdc_balance = 0
        usdt_balance = 0
        
        for asset in assets:
            if asset['asset-id'] == USDC_ASSET_ID:
                usdc_balance = asset['amount'] / 1_000_000
            elif asset['asset-id'] == USDT_ASSET_ID:
                usdt_balance = asset['amount'] / 1_000_000
        
        return {
            'app_opted_in': app_opted_in,
            'usdc_opted_in': usdc_opted_in,
            'usdt_opted_in': usdt_opted_in,
            'algo_balance': algo_balance,
            'usdc_balance': usdc_balance,
            'usdt_balance': usdt_balance
        }
    except Exception as e:
        print(f"Error checking user: {e}")
        return None


def print_status(label, status, details=""):
    """Print a status line"""
    icon = "✅" if status else "❌"
    print(f"{icon} {label:<40} {details}")


if __name__ == "__main__":
    print("=" * 70)
    print("VAULT SYSTEM SETUP CHECKER")
    print("=" * 70)
    
    print(f"\n📋 Configuration:")
    print(f"   Account: {faucet_address}")
    print(f"   App ID: {APP_ID}")
    print(f"   USDC Asset ID: {USDC_ASSET_ID}")
    print(f"   USDT Asset ID: {USDT_ASSET_ID}")
    
    print(f"\n🔍 Checking Contract Setup...")
    print("-" * 70)
    
    usdc_ok, usdt_ok, usdc_id, usdt_id = check_contract_asset_ids()
    print_status("Contract USDC Asset ID", usdc_ok, f"(Current: {usdc_id})")
    print_status("Contract USDT Asset ID", usdt_ok, f"(Current: {usdt_id})")
    
    if not usdc_ok or not usdt_ok:
        print("\n⚠️  Run: python set_asset_ids.py")
    
    print(f"\n🔍 Checking User Setup...")
    print("-" * 70)
    
    user_status = check_user_opted_in(faucet_address)
    
    if user_status:
        print_status("Opted into Vault Contract", user_status['app_opted_in'])
        print_status("Opted into USDC", user_status['usdc_opted_in'])
        print_status("Opted into USDT", user_status['usdt_opted_in'])
        
        print(f"\n💰 Balances:")
        print(f"   ALGO: {user_status['algo_balance']:.4f}")
        print(f"   USDC: {user_status['usdc_balance']:.2f}")
        print(f"   USDT: {user_status['usdt_balance']:.2f}")
        
        if not user_status['app_opted_in']:
            print("\n⚠️  Run: python optin_to_vault.py")
        
        if not user_status['usdc_opted_in'] or not user_status['usdt_opted_in']:
            print("\n⚠️  Opt-in to assets:")
            print("   1. Go to http://localhost:8080/vault")
            print("   2. Click opt-in buttons")
            print("   OR run: python setup_user_wallet.py YOUR_ADDRESS")
        
        if user_status['usdc_balance'] == 0 and user_status['usdt_balance'] == 0:
            print("\n⚠️  Get test tokens:")
            print(f"   python setup_user_wallet.py {faucet_address}")
    
    print("\n" + "=" * 70)
    
    all_ok = (usdc_ok and usdt_ok and user_status and 
              user_status['app_opted_in'] and 
              user_status['usdc_opted_in'] and 
              user_status['usdt_opted_in'])
    
    if all_ok:
        print("✅ ALL CHECKS PASSED - Ready to deposit!")
    else:
        print("⚠️  SETUP INCOMPLETE - Follow instructions above")
    
    print("=" * 70)
