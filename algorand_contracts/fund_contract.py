#!/usr/bin/env python3
"""
Fund the deployed smart contract with ALGO
"""
import algosdk
import json
import os
from algosdk.v2client import algod

# Load deployment info
with open('deployment_info.json', 'r') as f:
    deployment = json.load(f)

# Get mnemonic from environment or use the one from deployment
mnemonic = os.getenv('FAUCET_MNEMONIC', 'parrot gorilla diary reject pizza since toilet alcohol limit junk popular bright curve lyrics awesome move purchase cruel before slice carry ancient cycle abandon indicate')

# Recover account from mnemonic
private_key = algosdk.mnemonic.to_private_key(mnemonic)
account = algosdk.account.address_from_private_key(private_key)

# Connect to Algorand testnet
algod_client = algod.AlgodClient('', 'https://testnet-api.algonode.cloud', '')

# Get contract address
app_id = deployment['app_id']
contract_address = algosdk.logic.get_application_address(app_id)

print("=" * 60)
print("FUNDING SMART CONTRACT")
print("=" * 60)
print(f"\nContract App ID: {app_id}")
print(f"Contract Address: {contract_address}")
print(f"Funding from: {account}")

# Check current balance
try:
    contract_info = algod_client.account_info(contract_address)
    current_balance = contract_info['amount'] / 1_000_000
    print(f"Current Contract Balance: {current_balance} ALGO")
except:
    current_balance = 0
    print(f"Current Contract Balance: 0 ALGO (account not yet on chain)")

# Check funder balance
funder_info = algod_client.account_info(account)
funder_balance = funder_info['amount'] / 1_000_000
print(f"Funder Balance: {funder_balance} ALGO")

# Fund with 5 ALGO (enough for contract operations and asset opt-ins)
funding_amount = 5_000_000  # 5 ALGO in microALGOs

if funder_balance < 5.1:
    print(f"\n❌ ERROR: Insufficient balance. Need at least 5.1 ALGO, have {funder_balance} ALGO")
    exit(1)

print(f"\n💰 Sending {funding_amount / 1_000_000} ALGO to contract...")

try:
    # Get suggested params
    params = algod_client.suggested_params()
    
    # Create payment transaction
    txn = algosdk.transaction.PaymentTxn(
        sender=account,
        sp=params,
        receiver=contract_address,
        amt=funding_amount,
        note=b"Initial contract funding"
    )
    
    # Sign transaction
    signed_txn = txn.sign(private_key)
    
    # Send transaction
    tx_id = algod_client.send_transaction(signed_txn)
    print(f"Transaction ID: {tx_id}")
    
    # Wait for confirmation
    print("Waiting for confirmation...")
    confirmed_txn = algosdk.transaction.wait_for_confirmation(algod_client, tx_id, 4)
    print(f"✅ Transaction confirmed in round {confirmed_txn['confirmed-round']}")
    
    # Check new balance
    contract_info = algod_client.account_info(contract_address)
    new_balance = contract_info['amount'] / 1_000_000
    print(f"\n✅ Contract funded successfully!")
    print(f"New Contract Balance: {new_balance} ALGO")
    
    # Check remaining funder balance
    funder_info = algod_client.account_info(account)
    remaining_balance = funder_info['amount'] / 1_000_000
    print(f"Remaining Funder Balance: {remaining_balance} ALGO")
    
    print("\n" + "=" * 60)
    print("FUNDING COMPLETE ✅")
    print("=" * 60)
    
except Exception as e:
    print(f"\n❌ FUNDING FAILED: {e}")
    exit(1)
