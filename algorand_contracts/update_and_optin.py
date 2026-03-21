#!/usr/bin/env python3
"""
Update contract and opt-in to assets
"""

import os
import subprocess
import json
from algosdk import account, mnemonic, transaction
from algosdk.v2client import algod

# Algorand node configuration
ALGOD_ADDRESS = "https://testnet-api.algonode.cloud"
ALGOD_TOKEN = ""

algod_client = algod.AlgodClient(ALGOD_TOKEN, ALGOD_ADDRESS)

def compile_and_update():
    """Compile the contract and update it"""
    print("\n📝 Compiling updated contract...")
    result = subprocess.run(['python', 'vault_contract.py'], capture_output=True, text=True)
    if result.returncode != 0:
        print(f"❌ Compilation failed: {result.stderr}")
        return False
    print("✅ Contract compiled successfully")
    return True

def update_contract(creator_mnemonic, app_id):
    """Update the existing contract"""
    import base64
    
    creator_private_key = mnemonic.to_private_key(creator_mnemonic)
    creator_address = account.address_from_private_key(creator_private_key)
    
    print(f"\n🔄 Updating contract {app_id}...")
    
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
    print("✅ Contract updated successfully!")
    return True

def optin_to_asset(creator_mnemonic, app_id, asset_id):
    """Call the contract to opt-in to an asset"""
    creator_private_key = mnemonic.to_private_key(creator_mnemonic)
    creator_address = account.address_from_private_key(creator_private_key)
    
    print(f"\n🔗 Opting contract into Asset ID {asset_id}...")
    
    params = algod_client.suggested_params()
    
    # Create app call transaction with asset reference
    txn = transaction.ApplicationCallTxn(
        sender=creator_address,
        sp=params,
        index=app_id,
        on_complete=transaction.OnComplete.NoOpOC,
        app_args=[b"optin_asset"],
        foreign_assets=[asset_id]
    )
    
    signed_txn = txn.sign(creator_private_key)
    txid = algod_client.send_transaction(signed_txn)
    
    print(f"Transaction ID: {txid}")
    print("Waiting for confirmation...")
    transaction.wait_for_confirmation(algod_client, txid, 4)
    print(f"✅ Contract opted in to Asset ID {asset_id}")
    return True

def main():
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
    
    try:
        with open('asset_ids.json', 'r') as f:
            assets = json.load(f)
            usdc_id = assets['USDC_ASSET_ID']
            usdt_id = assets['USDT_ASSET_ID']
    except:
        usdc_id = int(os.getenv('USDC_ASSET_ID', '757493637'))
        usdt_id = int(os.getenv('USDT_ASSET_ID', '757493641'))
    
    print("=" * 70)
    print("UPDATE CONTRACT AND OPT-IN TO ASSETS")
    print("=" * 70)
    print(f"\nApp ID: {app_id}")
    print(f"USDC Asset ID: {usdc_id}")
    print(f"USDT Asset ID: {usdt_id}")
    
    # Step 1: Compile contract
    if not compile_and_update():
        return
    
    # Step 2: Update contract
    try:
        update_contract(mnemonic_phrase, app_id)
    except Exception as e:
        print(f"❌ Update failed: {e}")
        return
    
    # Step 3: Opt-in to USDC
    try:
        optin_to_asset(mnemonic_phrase, app_id, usdc_id)
    except Exception as e:
        print(f"❌ USDC opt-in failed: {e}")
    
    # Step 4: Opt-in to USDT
    try:
        optin_to_asset(mnemonic_phrase, app_id, usdt_id)
    except Exception as e:
        print(f"❌ USDT opt-in failed: {e}")
    
    print("\n" + "=" * 70)
    print("✅ ALL DONE!")
    print("=" * 70)
    print("\nContract updated and opted in to assets.")
    print("You can now deposit USDC and USDT to the vault!")

if __name__ == "__main__":
    main()
