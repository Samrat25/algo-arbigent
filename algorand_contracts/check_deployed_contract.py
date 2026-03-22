#!/usr/bin/env python3
"""Check the deployed contract to understand its structure"""

import os
from algosdk.v2client import algod
from dotenv import load_dotenv
import base64

# Load environment
load_dotenv('../agentic_api/.env')

# Algorand client
algod_client = algod.AlgodClient('', 'https://testnet-api.algonode.cloud')

# Get app ID
APP_ID = int(os.getenv('APP_ID', '0'))

print(f"Checking deployed contract: {APP_ID}")
print("=" * 60)

# Get application info
app_info = algod_client.application_info(APP_ID)
params = app_info['params']

print(f"Creator: {params['creator']}")
print(f"Approval Program: {len(params['approval-program'])} bytes")
print(f"Clear Program: {len(params['clear-state-program'])} bytes")

# Check global state
if 'global-state' in params:
    print("\nGlobal State:")
    for item in params['global-state']:
        key = base64.b64decode(item['key']).decode('utf-8')
        if item['value']['type'] == 1:  # bytes
            value = base64.b64decode(item['value']['bytes']).hex()
        else:  # uint
            value = item['value']['uint']
        print(f"  {key}: {value}")

print("\n✅ Contract check complete")
