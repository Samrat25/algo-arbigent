#!/usr/bin/env python3
"""Check contract asset balances"""

from algosdk.v2client import algod
from algosdk.logic import get_application_address

# Algorand node configuration
ALGOD_ADDRESS = "https://testnet-api.algonode.cloud"
ALGOD_TOKEN = ""

# Initialize algod client
algod_client = algod.AlgodClient(ALGOD_TOKEN, ALGOD_ADDRESS)

app_id = 757475765
usdc_id = 757493637
usdt_id = 757493641

contract_addr = get_application_address(app_id)
print(f"Contract Address: {contract_addr}")
print(f"App ID: {app_id}")
print()

info = algod_client.account_info(contract_addr)
print(f"ALGO Balance: {info['amount']/1_000_000:.6f} ALGO")
print()

assets = info.get('assets', [])
print(f"Total Assets: {len(assets)}")
print()

for asset in assets:
    asset_id = asset['asset-id']
    amount = asset['amount'] / 1_000_000
    
    if asset_id == usdc_id:
        print(f"✅ USDC (Asset {asset_id}): {amount:.6f}")
    elif asset_id == usdt_id:
        print(f"✅ USDT (Asset {asset_id}): {amount:.6f}")
    else:
        print(f"   Asset {asset_id}: {amount:.6f}")

print()

# Check if contract has USDC and USDT
has_usdc = any(a['asset-id'] == usdc_id for a in assets)
has_usdt = any(a['asset-id'] == usdt_id for a in assets)

if has_usdc:
    usdc_amount = next(a['amount'] for a in assets if a['asset-id'] == usdc_id)
    print(f"USDC Balance: {usdc_amount/1_000_000:.6f}")
else:
    print("❌ Contract has NO USDC tokens!")
    
if has_usdt:
    usdt_amount = next(a['amount'] for a in assets if a['asset-id'] == usdt_id)
    print(f"USDT Balance: {usdt_amount/1_000_000:.6f}")
else:
    print("❌ Contract has NO USDT tokens!")

print()
print("=" * 60)
if not has_usdc or not has_usdt:
    print("⚠️  CONTRACT NEEDS FUNDING!")
    print("The contract is opted in but has no tokens to transfer.")
    print("Run: python fund_contract.py")
else:
    print("✅ Contract has both USDC and USDT tokens")
