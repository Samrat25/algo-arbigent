#!/usr/bin/env python3
"""
Create USDC and USDT test assets on Algorand Testnet
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

def create_asset(creator_mnemonic, asset_name, unit_name, total_supply, decimals):
    """
    Create a new ASA (Algorand Standard Asset)
    """
    # Get creator account from mnemonic
    creator_private_key = mnemonic.to_private_key(creator_mnemonic)
    creator_address = account.address_from_private_key(creator_private_key)
    
    print(f"\n📝 Creating {asset_name} ({unit_name})...")
    print(f"Creator: {creator_address}")
    
    # Get suggested parameters
    params = algod_client.suggested_params()
    
    # Create asset transaction
    txn = transaction.AssetConfigTxn(
        sender=creator_address,
        sp=params,
        total=total_supply,
        default_frozen=False,
        unit_name=unit_name,
        asset_name=asset_name,
        manager=creator_address,
        reserve=creator_address,
        freeze=creator_address,
        clawback=creator_address,
        url=f"https://testnet.algoexplorer.io",
        decimals=decimals
    )
    
    # Sign transaction
    signed_txn = txn.sign(creator_private_key)
    
    # Send transaction
    txid = algod_client.send_transaction(signed_txn)
    print(f"Transaction ID: {txid}")
    
    # Wait for confirmation
    print("Waiting for confirmation...")
    confirmed_txn = transaction.wait_for_confirmation(algod_client, txid, 4)
    
    # Get asset ID
    asset_id = confirmed_txn["asset-index"]
    print(f"✅ {asset_name} created with Asset ID: {asset_id}")
    
    return asset_id

def opt_in_asset(account_mnemonic, asset_id):
    """
    Opt-in to an asset (required before receiving it)
    """
    private_key = mnemonic.to_private_key(account_mnemonic)
    address = account.address_from_private_key(private_key)
    
    print(f"\n🔗 Opting in to Asset ID {asset_id}...")
    
    params = algod_client.suggested_params()
    
    # Asset opt-in transaction (amount = 0, receiver = sender)
    txn = transaction.AssetTransferTxn(
        sender=address,
        sp=params,
        receiver=address,
        amt=0,
        index=asset_id
    )
    
    signed_txn = txn.sign(private_key)
    txid = algod_client.send_transaction(signed_txn)
    
    print(f"Transaction ID: {txid}")
    print("Waiting for confirmation...")
    transaction.wait_for_confirmation(algod_client, txid, 4)
    print(f"✅ Opted in to Asset ID {asset_id}")

def transfer_asset(sender_mnemonic, receiver_address, asset_id, amount):
    """
    Transfer asset to another account
    """
    private_key = mnemonic.to_private_key(sender_mnemonic)
    sender_address = account.address_from_private_key(private_key)
    
    print(f"\n💸 Transferring {amount} of Asset ID {asset_id}...")
    print(f"From: {sender_address}")
    print(f"To: {receiver_address}")
    
    params = algod_client.suggested_params()
    
    txn = transaction.AssetTransferTxn(
        sender=sender_address,
        sp=params,
        receiver=receiver_address,
        amt=amount,
        index=asset_id
    )
    
    signed_txn = txn.sign(private_key)
    txid = algod_client.send_transaction(signed_txn)
    
    print(f"Transaction ID: {txid}")
    print("Waiting for confirmation...")
    transaction.wait_for_confirmation(algod_client, txid, 4)
    print(f"✅ Transfer complete")

def main():
    # Load mnemonic from environment or prompt
    mnemonic_phrase = os.getenv('FAUCET_MNEMONIC')
    
    if not mnemonic_phrase:
        print("Enter your mnemonic phrase:")
        mnemonic_phrase = input().strip()
    
    # Get account address
    private_key = mnemonic.to_private_key(mnemonic_phrase)
    address = account.address_from_private_key(private_key)
    
    print(f"\n🔑 Account: {address}")
    
    # Check balance
    account_info = algod_client.account_information(address)
    balance = account_info['amount'] / 1_000_000
    print(f"💰 Balance: {balance} ALGO")
    
    if balance < 1:
        print("❌ Insufficient balance. Need at least 1 ALGO to create assets.")
        return
    
    # Create USDC
    print("\n" + "="*60)
    usdc_id = create_asset(
        creator_mnemonic=mnemonic_phrase,
        asset_name="USD Coin (Test)",
        unit_name="USDC",
        total_supply=1_000_000_000_000,  # 1 million USDC (with 6 decimals)
        decimals=6
    )
    
    # Create USDT
    print("\n" + "="*60)
    usdt_id = create_asset(
        creator_mnemonic=mnemonic_phrase,
        asset_name="Tether USD (Test)",
        unit_name="USDT",
        total_supply=1_000_000_000_000,  # 1 million USDT (with 6 decimals)
        decimals=6
    )
    
    # Save asset IDs
    asset_info = {
        "USDC_ASSET_ID": usdc_id,
        "USDT_ASSET_ID": usdt_id,
        "creator": address
    }
    
    with open('asset_ids.json', 'w') as f:
        json.dump(asset_info, f, indent=2)
    
    print("\n" + "="*60)
    print("✅ Assets created successfully!")
    print(f"\nUSDC Asset ID: {usdc_id}")
    print(f"USDT Asset ID: {usdt_id}")
    print(f"\nAsset IDs saved to asset_ids.json")
    print("\n📝 Update your .env file with these values:")
    print(f"USDC_ASSET_ID={usdc_id}")
    print(f"USDT_ASSET_ID={usdt_id}")

if __name__ == "__main__":
    main()
