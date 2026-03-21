#!/usr/bin/env python3
"""
Opt-in the smart contract to USDC and USDT assets
"""

import os
from algosdk import account, mnemonic, transaction
from algosdk.v2client import algod
import json

# Algorand node configuration
ALGOD_ADDRESS = "https://testnet-api.algonode.cloud"
ALGOD_TOKEN = ""

# Initialize algod client
algod_client = algod.AlgodClient(ALGOD_TOKEN, ALGOD_ADDRESS)

def optin_contract_to_asset(creator_mnemonic, app_id, asset_id):
    """
    Opt-in the smart contract to an asset by calling it from the creator
    """
    # Get creator account from mnemonic
    creator_private_key = mnemonic.to_private_key(creator_mnemonic)
    creator_address = account.address_from_private_key(creator_private_key)
    
    print(f"\n🔗 Opting contract into Asset ID {asset_id}...")
    print(f"App ID: {app_id}")
    print(f"Creator: {creator_address}")
    
    # Get suggested parameters
    params = algod_client.suggested_params()
    
    # Create app call transaction to trigger opt-in
    # The contract needs to have logic to opt-in to assets
    # For now, we'll send a payment to the contract and then manually opt-in
    
    # Get contract address
    from algosdk.logic import get_application_address
    contract_address = get_application_address(app_id)
    print(f"Contract Address: {contract_address}")
    
    # Create asset opt-in transaction FROM the contract
    # This requires the contract to sign it, which means we need to call the contract
    # to make it create and sign the opt-in transaction
    
    # For Algorand, the contract needs to execute the opt-in itself
    # We'll create an app call that triggers the contract to opt-in
    
    # Create app call transaction with asset reference
    txn = transaction.ApplicationCallTxn(
        sender=creator_address,
        sp=params,
        index=app_id,
        on_complete=transaction.OnComplete.NoOpOC,
        app_args=[b"optin_asset"],
        foreign_assets=[asset_id]
    )
    
    # Sign transaction
    signed_txn = txn.sign(creator_private_key)
    
    # Send transaction
    try:
        txid = algod_client.send_transaction(signed_txn)
        print(f"Transaction ID: {txid}")
        
        # Wait for confirmation
        print("Waiting for confirmation...")
        confirmed_txn = transaction.wait_for_confirmation(algod_client, txid, 4)
        print(f"✅ Contract opted in to Asset ID {asset_id}")
        return True
    except Exception as e:
        print(f"❌ Error: {e}")
        print("\nNote: The contract needs to have opt-in logic implemented.")
        print("Let's try a different approach - funding the contract with assets directly.")
        return False

def fund_contract_with_asset(creator_mnemonic, app_id, asset_id, amount):
    """
    Send assets to the contract address
    This will fail if contract hasn't opted in, but we'll try anyway
    """
    creator_private_key = mnemonic.to_private_key(creator_mnemonic)
    creator_address = account.address_from_private_key(creator_private_key)
    
    from algosdk.logic import get_application_address
    contract_address = get_application_address(app_id)
    
    print(f"\n💸 Sending {amount} of Asset {asset_id} to contract...")
    print(f"From: {creator_address}")
    print(f"To: {contract_address}")
    
    params = algod_client.suggested_params()
    
    txn = transaction.AssetTransferTxn(
        sender=creator_address,
        sp=params,
        receiver=contract_address,
        amt=amount,
        index=asset_id
    )
    
    signed_txn = txn.sign(creator_private_key)
    
    try:
        txid = algod_client.send_transaction(signed_txn)
        print(f"Transaction ID: {txid}")
        print("Waiting for confirmation...")
        transaction.wait_for_confirmation(algod_client, txid, 4)
        print(f"✅ Sent {amount} of Asset {asset_id} to contract")
        return True
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

def main():
    # Load mnemonic from environment
    mnemonic_phrase = os.getenv('FAUCET_MNEMONIC')
    
    if not mnemonic_phrase:
        print("Enter your mnemonic phrase:")
        mnemonic_phrase = input().strip()
    
    # Load deployment info
    try:
        with open('deployment_info.json', 'r') as f:
            deployment = json.load(f)
            app_id = deployment['app_id']
    except:
        app_id = int(os.getenv('APP_ID', '757475765'))
    
    # Load asset IDs
    try:
        with open('asset_ids.json', 'r') as f:
            assets = json.load(f)
            usdc_id = assets['USDC_ASSET_ID']
            usdt_id = assets['USDT_ASSET_ID']
    except:
        usdc_id = int(os.getenv('USDC_ASSET_ID', '757493637'))
        usdt_id = int(os.getenv('USDT_ASSET_ID', '757493641'))
    
    print("=" * 60)
    print("CONTRACT ASSET OPT-IN")
    print("=" * 60)
    print(f"\nApp ID: {app_id}")
    print(f"USDC Asset ID: {usdc_id}")
    print(f"USDT Asset ID: {usdt_id}")
    
    # Get contract address
    from algosdk.logic import get_application_address
    contract_address = get_application_address(app_id)
    print(f"Contract Address: {contract_address}")
    
    # Check contract balance
    try:
        contract_info = algod_client.account_info(contract_address)
        balance = contract_info['amount'] / 1_000_000
        print(f"Contract ALGO Balance: {balance} ALGO")
        
        # Check if already opted in
        assets = contract_info.get('assets', [])
        usdc_opted = any(a['asset-id'] == usdc_id for a in assets)
        usdt_opted = any(a['asset-id'] == usdt_id for a in assets)
        
        print(f"\nCurrent Status:")
        print(f"  USDC Opted In: {'✅' if usdc_opted else '❌'}")
        print(f"  USDT Opted In: {'✅' if usdt_opted else '❌'}")
        
        if usdc_opted and usdt_opted:
            print("\n✅ Contract already opted in to both assets!")
            return
            
    except Exception as e:
        print(f"Error checking contract: {e}")
    
    print("\n" + "=" * 60)
    print("SOLUTION: Manual Opt-in Required")
    print("=" * 60)
    print("\nThe contract needs to opt-in to assets through a transaction.")
    print("Since the current contract may not have opt-in logic, we need to:")
    print("\n1. Update the contract to handle asset opt-ins")
    print("2. Or manually send opt-in transactions")
    print("\nLet me create the opt-in transactions...")
    
    # Try to opt-in
    print("\n" + "=" * 60)
    print("Attempting USDC Opt-in")
    print("=" * 60)
    optin_contract_to_asset(mnemonic_phrase, app_id, usdc_id)
    
    print("\n" + "=" * 60)
    print("Attempting USDT Opt-in")
    print("=" * 60)
    optin_contract_to_asset(mnemonic_phrase, app_id, usdt_id)

if __name__ == "__main__":
    main()
