#!/usr/bin/env python3
"""
Verify Algorand Smart Contract Deployment
"""
import algosdk
import json

# Load deployment info
with open('deployment_info.json', 'r') as f:
    deployment = json.load(f)

# Connect to Algorand testnet
algod_client = algosdk.v2client.algod.AlgodClient('', 'https://testnet-api.algonode.cloud', '')

print("=" * 60)
print("ALGORAND CONTRACT VERIFICATION")
print("=" * 60)

try:
    # Verify App
    app_info = algod_client.application_info(deployment['app_id'])
    print(f"\n✅ Smart Contract VERIFIED")
    print(f"   App ID: {app_info['id']}")
    print(f"   Creator: {app_info['params']['creator']}")
    print(f"   Approval Program: {len(app_info['params']['approval-program'])} bytes")
    print(f"   Clear Program: {len(app_info['params']['clear-state-program'])} bytes")
    
    # Verify USDC Asset
    usdc_info = algod_client.asset_info(deployment['usdc_asset_id'])
    print(f"\n✅ USDC Asset VERIFIED")
    print(f"   Asset ID: {usdc_info['index']}")
    print(f"   Name: {usdc_info['params']['name']}")
    print(f"   Unit: {usdc_info['params']['unit-name']}")
    print(f"   Total: {usdc_info['params']['total'] / 1000000}")
    
    # Verify USDT Asset
    usdt_info = algod_client.asset_info(deployment['usdt_asset_id'])
    print(f"\n✅ USDT Asset VERIFIED")
    print(f"   Asset ID: {usdt_info['index']}")
    print(f"   Name: {usdt_info['params']['name']}")
    print(f"   Unit: {usdt_info['params']['unit-name']}")
    print(f"   Total: {usdt_info['params']['total'] / 1000000}")
    
    # Check creator account
    creator_info = algod_client.account_info(deployment['creator_address'])
    print(f"\n✅ Creator Account VERIFIED")
    print(f"   Address: {deployment['creator_address']}")
    print(f"   Balance: {creator_info['amount'] / 1000000} ALGO")
    print(f"   Assets: {len(creator_info.get('assets', []))}")
    
    # Get app address
    app_address = algosdk.logic.get_application_address(deployment['app_id'])
    print(f"\n✅ Contract Address")
    print(f"   Address: {app_address}")
    
    try:
        app_account = algod_client.account_info(app_address)
        print(f"   Balance: {app_account['amount'] / 1000000} ALGO")
    except:
        print(f"   Balance: 0 ALGO (not funded yet)")
    
    print("\n" + "=" * 60)
    print("ALL VERIFICATIONS PASSED ✅")
    print("=" * 60)
    
except Exception as e:
    print(f"\n❌ VERIFICATION FAILED: {e}")
    exit(1)
