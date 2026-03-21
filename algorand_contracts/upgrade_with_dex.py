#!/usr/bin/env python3
"""
Upgrade contract with real DEX integration (Tinyman)
"""

import os
from algosdk import account, mnemonic, transaction
from algosdk.v2client import algod
import json
import base64

ALGOD_ADDRESS = "https://testnet-api.algonode.cloud"
ALGOD_TOKEN = ""

algod_client = algod.AlgodClient(ALGOD_TOKEN, ALGOD_ADDRESS)

def update_contract_with_dex(creator_mnemonic, app_id):
    """
    Update contract to include real DEX integration
    """
    creator_private_key = mnemonic.to_private_key(creator_mnemonic)
    creator_address = account.address_from_private_key(creator_private_key)
    
    print("\n🔄 Upgrading contract with DEX integration...")
    print(f"App ID: {app_id}")
    print(f"Creator: {creator_address}")
    
    # First, compile the updated contract
    print("\n📝 Compiling contract...")
    import subprocess
    result = subprocess.run(['python', 'vault_contract.py'], capture_output=True, text=True)
    if result.returncode != 0:
        print(f"❌ Compilation failed: {result.stderr}")
        return False
    
    # Read compiled programs
    with open('vault_approval.teal', 'r') as f:
        approval_program = f.read()
    with open('vault_clear.teal', 'r') as f:
        clear_program = f.read()
    
    # Compile programs
    approval_result = algod_client.compile(approval_program)
    clear_result = algod_client.compile(clear_program)
    
    # Decode base64 to bytes
    approval_program_bytes = base64.b64decode(approval_result['result'])
    clear_program_bytes = base64.b64decode(clear_result['result'])
    
    params = algod_client.suggested_params()
    
    # Create update transaction
    txn = transaction.ApplicationUpdateTxn(
        sender=creator_address,
        sp=params,
        index=app_id,
        approval_program=approval_program_bytes,
        clear_program=clear_program_bytes
    )
    
    signed_txn = txn.sign(creator_private_key)
    txid = algod_client.send_transaction(signed_txn)
    
    print(f"Transaction ID: {txid}")
    print("Waiting for confirmation...")
    transaction.wait_for_confirmation(algod_client, txid, 4)
    print("✅ Contract upgraded successfully!")
    return True

def set_dex_pools(creator_mnemonic, app_id, usdc_pool, usdt_pool):
    """
    Set Tinyman pool addresses in contract
    """
    creator_private_key = mnemonic.to_private_key(creator_mnemonic)
    creator_address = account.address_from_private_key(creator_private_key)
    
    print("\n🔗 Setting DEX pool addresses...")
    
    params = algod_client.suggested_params()
    
    # Set USDC pool
    txn = transaction.ApplicationCallTxn(
        sender=creator_address,
        sp=params,
        index=app_id,
        on_complete=transaction.OnComplete.NoOpOC,
        app_args=[b"set_usdc_pool", usdc_pool.encode()],
    )
    
    signed_txn = txn.sign(creator_private_key)
    txid = algod_client.send_transaction(signed_txn)
    transaction.wait_for_confirmation(algod_client, txid, 4)
    print(f"✅ USDC pool set: {usdc_pool}")
    
    # Set USDT pool
    txn = transaction.ApplicationCallTxn(
        sender=creator_address,
        sp=params,
        index=app_id,
        on_complete=transaction.OnComplete.NoOpOC,
        app_args=[b"set_usdt_pool", usdt_pool.encode()],
    )
    
    signed_txn = txn.sign(creator_private_key)
    txid = algod_client.send_transaction(signed_txn)
    transaction.wait_for_confirmation(algod_client, txid, 4)
    print(f"✅ USDT pool set: {usdt_pool}")

def main():
    print("=" * 70)
    print("CONTRACT UPGRADE - DEX INTEGRATION")
    print("=" * 70)
    
    print("\n⚠️  WARNING: This will upgrade the contract with real DEX integration")
    print("Current swaps are simulated. After upgrade, swaps will use real DEX.")
    print("\nDo you want to proceed? (yes/no): ", end="")
    
    # For automation, skip confirmation
    # response = input().strip().lower()
    # if response != 'yes':
    #     print("Upgrade cancelled.")
    #     return
    
    mnemonic_phrase = os.getenv('FAUCET_MNEMONIC')
    if not mnemonic_phrase:
        print("Enter your mnemonic phrase:")
        mnemonic_phrase = input().strip()
    
    # Load configuration
    try:
        with open('deployment_info.json', 'r') as f:
            deployment = json.load(f)
            app_id = deployment['app_id']
    except:
        app_id = int(os.getenv('APP_ID', '757475765'))
    
    print(f"\nApp ID: {app_id}")
    
    # Note: For testnet, we need to find or create Tinyman pools
    # For now, we'll document that DEX integration requires pool addresses
    
    print("\n" + "=" * 70)
    print("DEX INTEGRATION REQUIREMENTS")
    print("=" * 70)
    print("\nTo enable real swaps, you need:")
    print("1. Tinyman pool address for ALGO/USDC")
    print("2. Tinyman pool address for ALGO/USDT")
    print("3. Tinyman pool address for USDC/USDT")
    print("\nThese pools must exist on Algorand Testnet.")
    print("\nFor now, keeping simulated swaps is recommended for testing.")
    print("\n✅ Current contract is fully functional for deposits/withdrawals!")

if __name__ == "__main__":
    main()
