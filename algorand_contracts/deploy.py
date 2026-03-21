"""
Deployment script for Algorand Vault Smart Contract
"""

import base64
from algosdk import account, mnemonic
from algosdk.v2client import algod
from algosdk.transaction import (
    ApplicationCreateTxn,
    ApplicationOptInTxn,
    AssetConfigTxn,
    StateSchema,
    OnComplete,
    wait_for_confirmation
)


# Algorand node configuration
ALGOD_ADDRESS = "https://testnet-api.algonode.cloud"
ALGOD_TOKEN = ""  # Public node doesn't require token


def create_algod_client():
    """Create Algorand client"""
    return algod.AlgodClient(ALGOD_TOKEN, ALGOD_ADDRESS)


def compile_program(client, source_code):
    """Compile TEAL source code"""
    compile_response = client.compile(source_code)
    return base64.b64decode(compile_response['result'])


def create_asset(client, creator_address, creator_private_key, asset_name, unit_name, total_supply, decimals):
    """Create an Algorand Standard Asset (ASA)"""
    params = client.suggested_params()
    
    txn = AssetConfigTxn(
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
        decimals=decimals
    )
    
    # Sign and send transaction
    signed_txn = txn.sign(creator_private_key)
    tx_id = client.send_transaction(signed_txn)
    
    # Wait for confirmation
    confirmed_txn = wait_for_confirmation(client, tx_id, 4)
    asset_id = confirmed_txn["asset-index"]
    
    print(f"✅ Created {asset_name} (Asset ID: {asset_id})")
    return asset_id


def deploy_application(client, creator_address, creator_private_key, approval_program, clear_program):
    """Deploy the vault application"""
    params = client.suggested_params()
    
    # Define state schema
    global_schema = StateSchema(num_uints=4, num_byte_slices=0)
    local_schema = StateSchema(num_uints=5, num_byte_slices=0)
    
    # Create application transaction
    txn = ApplicationCreateTxn(
        sender=creator_address,
        sp=params,
        on_complete=OnComplete.NoOpOC,
        approval_program=approval_program,
        clear_program=clear_program,
        global_schema=global_schema,
        local_schema=local_schema,
        extra_pages=0
    )
    
    # Sign and send transaction
    signed_txn = txn.sign(creator_private_key)
    tx_id = client.send_transaction(signed_txn)
    
    # Wait for confirmation
    confirmed_txn = wait_for_confirmation(client, tx_id, 4)
    app_id = confirmed_txn["application-index"]
    
    print(f"✅ Deployed Vault Application (App ID: {app_id})")
    return app_id


def main():
    """Main deployment function"""
    print("🚀 Starting Algorand Vault Deployment\n")
    
    # Get creator account from mnemonic
    print("Enter your Algorand account mnemonic (25 words):")
    creator_mnemonic = input().strip()
    
    try:
        creator_private_key = mnemonic.to_private_key(creator_mnemonic)
        creator_address = account.address_from_private_key(creator_private_key)
        print(f"✅ Creator Address: {creator_address}\n")
    except Exception as e:
        print(f"❌ Invalid mnemonic: {e}")
        return
    
    # Create Algod client
    client = create_algod_client()
    
    # Check account balance
    account_info = client.account_info(creator_address)
    balance = account_info.get('amount') / 1_000_000
    print(f"💰 Account Balance: {balance} ALGO\n")
    
    if balance < 1:
        print("❌ Insufficient balance. Please fund your account with testnet ALGO.")
        print("   Visit: https://bank.testnet.algorand.network/")
        return
    
    # Step 1: Create USDC Asset
    print("📦 Creating USDC Asset...")
    usdc_asset_id = create_asset(
        client,
        creator_address,
        creator_private_key,
        asset_name="USD Coin",
        unit_name="USDC",
        total_supply=1_000_000_000_000,  # 1 million USDC with 6 decimals
        decimals=6
    )
    
    # Step 2: Create USDT Asset
    print("📦 Creating USDT Asset...")
    usdt_asset_id = create_asset(
        client,
        creator_address,
        creator_private_key,
        asset_name="Tether USD",
        unit_name="USDT",
        total_supply=1_000_000_000_000,  # 1 million USDT with 6 decimals
        decimals=6
    )
    
    # Step 3: Compile and deploy smart contract
    print("\n📝 Compiling Smart Contract...")
    
    with open("vault_approval.teal", "r") as f:
        approval_program_source = f.read()
    
    with open("vault_clear.teal", "r") as f:
        clear_program_source = f.read()
    
    approval_program = compile_program(client, approval_program_source)
    clear_program = compile_program(client, clear_program_source)
    
    print("🚀 Deploying Smart Contract...")
    app_id = deploy_application(
        client,
        creator_address,
        creator_private_key,
        approval_program,
        clear_program
    )
    
    # Save deployment info
    deployment_info = {
        "app_id": app_id,
        "usdc_asset_id": usdc_asset_id,
        "usdt_asset_id": usdt_asset_id,
        "creator_address": creator_address,
        "network": "testnet"
    }
    
    with open("deployment_info.json", "w") as f:
        import json
        json.dump(deployment_info, f, indent=2)
    
    print("\n✅ Deployment Complete!")
    print(f"\n📋 Deployment Info:")
    print(f"   App ID: {app_id}")
    print(f"   USDC Asset ID: {usdc_asset_id}")
    print(f"   USDT Asset ID: {usdt_asset_id}")
    print(f"   Creator: {creator_address}")
    print(f"\n💾 Saved to deployment_info.json")


if __name__ == "__main__":
    main()
