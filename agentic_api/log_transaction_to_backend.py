"""
Script to log a transaction to the backend
"""
import requests
import os
from dotenv import load_dotenv

load_dotenv()

BACKEND_URL = os.getenv('BACKEND_API_URL', 'http://localhost:3001')
USER_ADDRESS = 'JPO5U3I5FBGUAB5QC6ZEBEQ5WLEF6SP6GPH5OWSSW6CLUYXJD3GPP3ULOM'

# The transaction we just executed
TX_ID = '5QGIRY6LQDRE3FQ3QTXTU2Y2TCTB542Z7LJXNTW4Y4BMDAVL4VIA'

def log_swap_transaction():
    """Log the swap transaction to backend"""
    
    print("Logging transaction to backend...")
    print(f"Backend URL: {BACKEND_URL}")
    print(f"Transaction ID: {TX_ID}")
    print()
    
    # Log as a withdrawal (USDC out)
    payload_withdraw = {
        "walletAddress": USER_ADDRESS,
        "coinSymbol": "USDC",
        "amount": "10000000",  # 10 USDC in microunits
        "transactionHash": TX_ID
    }
    
    try:
        response = requests.post(
            f"{BACKEND_URL}/vault/withdraw",
            json=payload_withdraw,
            timeout=5
        )
        
        print(f"Withdraw log response: {response.status_code}")
        if response.ok:
            print("✅ USDC withdrawal logged")
            print(response.json())
        else:
            print(f"❌ Failed: {response.text}")
    except Exception as e:
        print(f"❌ Error logging withdrawal: {e}")
    
    print()
    
    # Log as a deposit (USDT in)
    payload_deposit = {
        "walletAddress": USER_ADDRESS,
        "coinSymbol": "USDT",
        "amount": "9995000",  # 9.995 USDT in microunits
        "transactionHash": TX_ID + "-swap"  # Add suffix to make unique
    }
    
    try:
        response = requests.post(
            f"{BACKEND_URL}/vault/deposit",
            json=payload_deposit,
            timeout=5
        )
        
        print(f"Deposit log response: {response.status_code}")
        if response.ok:
            print("✅ USDT deposit logged")
            print(response.json())
        else:
            print(f"❌ Failed: {response.text}")
    except Exception as e:
        print(f"❌ Error logging deposit: {e}")
    
    print()
    print("Checking transaction history...")
    
    try:
        response = requests.get(
            f"{BACKEND_URL}/transactions/{USER_ADDRESS}",
            timeout=5
        )
        
        if response.ok:
            data = response.json()
            transactions = data.get('transactions', [])
            print(f"✅ Found {len(transactions)} transactions")
            
            for tx in transactions[:5]:  # Show last 5
                print(f"  - {tx['type']}: {tx['amountFormatted']:.2f} {tx['coinSymbol']} (TxID: {tx['transactionHash'][:20]}...)")
        else:
            print(f"❌ Failed to get transactions: {response.text}")
    except Exception as e:
        print(f"❌ Error getting transactions: {e}")

if __name__ == "__main__":
    log_swap_transaction()
