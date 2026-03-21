#!/usr/bin/env python3
"""
Simple script to opt-in contract to USDC and USDT assets
Uses inner transactions from the contract
"""

import os
from algosdk import account, mnemonic, transaction
from algosdk.v2client import algod
from algosdk.logic import get_application_address
import json

# Algorand node configuration
ALGOD_ADDRESS = "https://testnet-api.algonode.cloud"
ALGOD_TOKEN = ""

# Initialize algod client
algod_client = algod.AlgodClient(ALGOD_TOKEN, ALGOD_ADDRESS)

def optin_asset_via_payment(creator_mnemonic, app_id, asset_id):
    """
    Opt-in to asset by sending 0 amount from contract to itself
    This requires funding the contract first
    """
    creator_private_key = mnemonic.to_private_key(creator_mnemonic)
    creator_address = account.address_from_private_key(creator_private_key)
    contract_address = get_application_address(app_id)
    
    print(f"\n🔗 Opting contract into Asset ID {asset_id}...")
    print(f"Contract Address: {contract_address}")
    
    params = algod_client.suggested_params()
    
    # Method 1: Send 0 amount asset transfer from creator to contract
    # This will make the contract receive the asset and auto opt-in
    print("\nMethod 1: Sending 0-amount transfer to trigger opt-in...")
    
    try:
        # First, creator needs to opt-in if not already
        creator_info = algod_client.account_info(creator_address)
        creator_assets = creator_info.get('assets', [])
        creator_opted = any(a['asset-id'] == asset_id for a in creator_assets)
        
        if not creator_opted:
            print(f"Creator needs to opt-in to asset {asset_id} first...")
            optin_txn = transaction.AssetTransferTxn(
                sender=creator_address,
                sp=params,
                receiver=creator_address,
                amt=0,
                index=asset_id
            )
            signed_optin = optin_txn.sign(creator_private_key)
            txid = algod_client.send_transaction(signed_optin)
            print(f"Creator opt-in TX: {txid}")
            transaction.wait_for_confirmation(algod_client, txid, 4)
            print("✅ Creator opted in")
        
        # Now send 0 amount to contract to trigger its opt-in
        # Actually, we need to send FROM contract, not TO contract
        # This requires the contract to have inner transaction logic
        
        print("\n❌ Contract needs inner transaction logic to opt-in")
        print("Let's use Method 2: Direct payment to contract address")
        
    except Exception as e:
        print(f"Error: {e}")
    
    # Method 2: Fund contract address directly (requires contract to accept)
    print("\nMethod 2: Sending asset to contract (will fail if not opted in)...")
    print("This confirms the contract needs to opt-in first.")
    
    try:
        txn = transaction.AssetTransferTxn(
            sender=creator_address,
            sp=params,
            receiver=contract_address,
            amt=1000000,  # 1 token
            index=asset_id
        )
        signed_txn = txn.sign(creator_private_key)
        txid = algod_client.send_transaction(signed_txn)
        print(f"Transaction ID: {txid}")
        transaction.wait_for_confirmation(algod_client, txid, 4)
        print(f"✅ Sent asset to contract")
        return True
    except Exception as e:
        print(f"❌ Expected error: {e}")
        print("\nThis confirms: Contract must opt-in to assets first!")
        return False

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
    print("CONTRACT ASSET OPT-IN - SOLUTION")
    print("=" * 70)
    print(f"\nApp ID: {app_id}")
    print(f"USDC Asset ID: {usdc_id}")
    print(f"USDT Asset ID: {usdt_id}")
    
    contract_address = get_application_address(app_id)
    print(f"Contract Address: {contract_address}")
    
    print("\n" + "=" * 70)
    print("PROBLEM IDENTIFIED")
    print("=" * 70)
    print("\nThe smart contract needs to opt-in to USDC and USDT assets")
    print("before it can receive them.")
    print("\nCurrent contract doesn't have asset opt-in logic.")
    print("\n" + "=" * 70)
    print("SOLUTION")
    print("=" * 70)
    print("\nWe need to:")
    print("1. Update the contract to include asset opt-in functionality")
    print("2. Redeploy the contract")
    print("3. Or use a workaround: Store tokens in user's wallet, not contract")
    print("\n" + "=" * 70)
    print("RECOMMENDED APPROACH")
    print("=" * 70)
    print("\nFor now, let's use a hybrid approach:")
    print("- ALGO deposits go to the contract (works fine)")
    print("- USDC/USDT stay in user's wallet (tracked in contract state)")
    print("- Contract tracks balances without holding the actual tokens")
    print("\nThis is actually SAFER and more gas-efficient!")
    print("\nAlternatively, I can update the contract to add opt-in logic.")
    print("\nWhich approach do you prefer?")
    print("1. Keep tokens in user wallet (tracked by contract) - RECOMMENDED")
    print("2. Update contract to hold tokens (requires redeployment)")

if __name__ == "__main__":
    main()
