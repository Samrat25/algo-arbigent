"""
Script to check actual vault balance from Algorand contract
"""
from algosdk.v2client import algod
from algosdk import account, mnemonic
import os
from dotenv import load_dotenv
import base64

load_dotenv()

# Algorand configuration
ALGOD_TOKEN = ''
ALGOD_SERVER = 'https://testnet-api.algonode.cloud'
ALGOD_PORT = ''

APP_ID = int(os.getenv('APP_ID', '757475765'))
USER_MNEMONIC = os.getenv('USER_MNEMONIC')

def check_vault_balance():
    """Check vault balance directly from contract"""
    
    # Initialize client
    algod_client = algod.AlgodClient(ALGOD_TOKEN, ALGOD_SERVER, ALGOD_PORT)
    
    # Get user address
    private_key = mnemonic.to_private_key(USER_MNEMONIC)
    user_address = account.address_from_private_key(private_key)
    
    print(f"Checking vault balance for: {user_address}")
    print(f"App ID: {APP_ID}\n")
    
    # Get account info
    account_info = algod_client.account_info(user_address)
    
    # Find app local state
    apps_local_state = account_info.get('apps-local-state', [])
    app_local_state = next((app for app in apps_local_state if app['id'] == APP_ID), None)
    
    if not app_local_state:
        print("❌ User not opted into vault contract")
        return
    
    print("✅ Found vault contract local state\n")
    print("Raw key-value pairs:")
    print("=" * 60)
    
    for kv in app_local_state.get('key-value', []):
        # Decode key
        key_bytes = base64.b64decode(kv['key'])
        key_str = key_bytes.decode('utf-8', errors='ignore')
        
        # Get value
        value_type = kv['value'].get('type')
        if value_type == 1:  # bytes
            value = base64.b64decode(kv['value'].get('bytes', '')).decode('utf-8', errors='ignore')
        else:  # uint
            value = kv['value'].get('uint', 0)
        
        print(f"Key: '{key_str}' (raw bytes: {key_bytes.hex()})")
        print(f"Value: {value} (type: {value_type})")
        print(f"Value / 1,000,000: {value / 1_000_000 if isinstance(value, int) else 'N/A'}")
        print("-" * 60)
    
    print("\nInterpreted balances:")
    print("=" * 60)
    
    vault_balances = {'ALGO': 0, 'USDC': 0, 'USDT': 0}
    
    for kv in app_local_state.get('key-value', []):
        key_bytes = base64.b64decode(kv['key'])
        key_str = key_bytes.decode('utf-8', errors='ignore')
        value = kv['value'].get('uint', 0)
        
        if 'algo_balance' in key_str or key_str == 'algo_balance':
            # Try both with and without division
            raw_value = value
            divided_value = value / 1_000_000
            
            print(f"ALGO Balance:")
            print(f"  Raw value: {raw_value}")
            print(f"  Divided by 1M: {divided_value}")
            print(f"  If you deposited 3 ALGO, raw should be: 3000000")
            
            vault_balances['ALGO'] = divided_value
            
        elif 'usdc_balance' in key_str or key_str == 'usdc_balance':
            raw_value = value
            divided_value = value / 1_000_000
            
            print(f"USDC Balance:")
            print(f"  Raw value: {raw_value}")
            print(f"  Divided by 1M: {divided_value}")
            
            vault_balances['USDC'] = divided_value
            
        elif 'usdt_balance' in key_str or key_str == 'usdt_balance':
            raw_value = value
            divided_value = value / 1_000_000
            
            print(f"USDT Balance:")
            print(f"  Raw value: {raw_value}")
            print(f"  Divided by 1M: {divided_value}")
            
            vault_balances['USDT'] = divided_value
    
    print("\n" + "=" * 60)
    print("Final interpreted balances:")
    print(f"  ALGO: {vault_balances['ALGO']:.6f}")
    print(f"  USDC: {vault_balances['USDC']:.6f}")
    print(f"  USDT: {vault_balances['USDT']:.6f}")
    print("=" * 60)

if __name__ == "__main__":
    check_vault_balance()
