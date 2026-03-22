"""
Test script to manually execute a swap on the vault contract
This will test if swaps work and profits are added to vault
"""
from algosdk.v2client import algod
from algosdk import account, mnemonic, transaction
import os
from dotenv import load_dotenv
import time

load_dotenv()

# Algorand configuration
ALGOD_TOKEN = ''
ALGOD_SERVER = 'https://testnet-api.algonode.cloud'
ALGOD_PORT = ''

APP_ID = int(os.getenv('APP_ID', '757475765'))
USER_MNEMONIC = os.getenv('USER_MNEMONIC')

def execute_test_swap():
    """Execute a test swap: USDC → USDT"""
    
    # Initialize client
    algod_client = algod.AlgodClient(ALGOD_TOKEN, ALGOD_SERVER, ALGOD_PORT)
    
    # Get user account
    private_key = mnemonic.to_private_key(USER_MNEMONIC)
    user_address = account.address_from_private_key(private_key)
    
    print("=" * 60)
    print("Test Swap Execution")
    print("=" * 60)
    print(f"User Address: {user_address}")
    print(f"App ID: {APP_ID}")
    print()
    
    # Check vault balance before
    print("Checking vault balance BEFORE swap...")
    account_info = algod_client.account_info(user_address)
    apps_local_state = account_info.get('apps-local-state', [])
    app_local_state = next((app for app in apps_local_state if app['id'] == APP_ID), None)
    
    if not app_local_state:
        print("❌ User not opted into vault contract")
        return
    
    import base64
    balances_before = {}
    for kv in app_local_state.get('key-value', []):
        key_bytes = base64.b64decode(kv['key'])
        key_str = key_bytes.decode('utf-8', errors='ignore')
        value = kv['value'].get('uint', 0)
        
        if 'usdc_balance' in key_str:
            balances_before['USDC'] = value / 1_000_000
        elif 'usdt_balance' in key_str:
            balances_before['USDT'] = value / 1_000_000
        elif 'algo_balance' in key_str:
            balances_before['ALGO'] = value / 1_000_000
    
    print(f"BEFORE: ALGO={balances_before.get('ALGO', 0):.2f}, USDC={balances_before.get('USDC', 0):.2f}, USDT={balances_before.get('USDT', 0):.2f}")
    print()
    
    # Execute swap: USDC → USDT (10 USDC)
    print("Executing swap: 10 USDC → USDT...")
    
    try:
        params = algod_client.suggested_params()
        amount_micro = 10_000_000  # 10 USDC in microunits
        
        # Create application call transaction
        txn = transaction.ApplicationNoOpTxn(
            sender=user_address,
            sp=params,
            index=APP_ID,
            app_args=['swap_usdc_to_usdt'.encode(), amount_micro.to_bytes(8, 'big')]
        )
        
        # Sign transaction
        signed_txn = txn.sign(private_key)
        
        # Send transaction
        tx_id = algod_client.send_transaction(signed_txn)
        print(f"✅ Transaction sent: {tx_id}")
        print(f"🔗 View on AlgoExplorer: https://testnet.algoexplorer.io/tx/{tx_id}")
        
        # Wait for confirmation
        print("⏳ Waiting for confirmation...")
        confirmed_txn = transaction.wait_for_confirmation(algod_client, tx_id, 4)
        print(f"✅ Confirmed in round: {confirmed_txn['confirmed-round']}")
        print()
        
        # Check vault balance after
        print("Checking vault balance AFTER swap...")
        time.sleep(2)  # Wait a bit for state to update
        
        account_info = algod_client.account_info(user_address)
        apps_local_state = account_info.get('apps-local-state', [])
        app_local_state = next((app for app in apps_local_state if app['id'] == APP_ID), None)
        
        balances_after = {}
        for kv in app_local_state.get('key-value', []):
            key_bytes = base64.b64decode(kv['key'])
            key_str = key_bytes.decode('utf-8', errors='ignore')
            value = kv['value'].get('uint', 0)
            
            if 'usdc_balance' in key_str:
                balances_after['USDC'] = value / 1_000_000
            elif 'usdt_balance' in key_str:
                balances_after['USDT'] = value / 1_000_000
            elif 'algo_balance' in key_str:
                balances_after['ALGO'] = value / 1_000_000
        
        print(f"AFTER:  ALGO={balances_after.get('ALGO', 0):.2f}, USDC={balances_after.get('USDC', 0):.2f}, USDT={balances_after.get('USDT', 0):.2f}")
        print()
        
        # Calculate changes
        print("=" * 60)
        print("Changes:")
        print("=" * 60)
        usdc_change = balances_after.get('USDC', 0) - balances_before.get('USDC', 0)
        usdt_change = balances_after.get('USDT', 0) - balances_before.get('USDT', 0)
        algo_change = balances_after.get('ALGO', 0) - balances_before.get('ALGO', 0)
        
        print(f"ALGO: {algo_change:+.6f}")
        print(f"USDC: {usdc_change:+.6f}")
        print(f"USDT: {usdt_change:+.6f}")
        print()
        
        # Calculate profit/loss
        # Contract has 0.05% fee, so swapping 10 USDC should give ~9.995 USDT
        expected_usdt = 10 * 0.9995  # 99.95% of input (0.05% fee)
        actual_usdt = usdt_change
        
        print(f"Expected USDT: ~{expected_usdt:.4f}")
        print(f"Actual USDT: {actual_usdt:.4f}")
        
        if actual_usdt > 0:
            print("✅ Swap successful! USDT balance increased.")
        else:
            print("⚠️ No USDT increase detected.")
        
        print()
        print("=" * 60)
        print("Test completed!")
        print("=" * 60)
        
        return tx_id
        
    except Exception as e:
        print(f"❌ Error executing swap: {e}")
        import traceback
        traceback.print_exc()
        return None

if __name__ == "__main__":
    execute_test_swap()
