"""
Test script to create a mocked profit claim transaction
This simulates what happens after a successful arbitrage
"""
import requests
import os
import hashlib
import time
import random
from dotenv import load_dotenv

load_dotenv()

BACKEND_URL = os.getenv('BACKEND_API_URL', 'http://localhost:3001')
USER_ADDRESS = 'JPO5U3I5FBGUAB5QC6ZEBEQ5WLEF6SP6GPH5OWSSW6CLUYXJD3GPP3ULOM'

def generate_mock_tx_id():
    """Generate a realistic-looking mocked transaction ID"""
    random_data = f"{USER_ADDRESS}{time.time()}{random.random()}"
    mock_tx_hash = hashlib.sha256(random_data.encode()).hexdigest().upper()[:52]
    return f"PROFIT-{mock_tx_hash}"

def log_profit_claim(profit_usd: float, token: str = "USDT"):
    """Log a mocked profit claim transaction"""
    
    print(f"Creating mocked profit claim transaction...")
    print(f"Profit: ${profit_usd:.4f} USD")
    print(f"Token: {token}")
    print()
    
    # Generate mocked transaction ID
    mock_tx_id = generate_mock_tx_id()
    print(f"Generated Mock TxID: {mock_tx_id[:30]}...")
    print()
    
    # Convert profit to microunits (simplified - assumes 1:1 USD conversion)
    profit_micro = int(profit_usd * 1_000_000)
    
    # Log as deposit (profit added to vault)
    payload = {
        "walletAddress": USER_ADDRESS,
        "coinSymbol": token,
        "amount": str(profit_micro),
        "transactionHash": mock_tx_id
    }
    
    try:
        response = requests.post(
            f"{BACKEND_URL}/vault/deposit",
            json=payload,
            timeout=5
        )
        
        print(f"Response: {response.status_code}")
        if response.ok:
            print("✅ Profit claim logged successfully!")
            data = response.json()
            print(f"\nTransaction details:")
            print(f"  Type: Profit Claim (Arbitrage)")
            print(f"  Amount: {profit_usd:.6f} {token}")
            print(f"  TxID: {mock_tx_id}")
            print(f"  Status: This will appear in frontend as 'Profit Claim'")
            print(f"  Note: Real swaps have real explorer links, profit is mocked for display")
            print()
            return True
        else:
            print(f"❌ Failed: {response.text}")
            return False
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

def check_transaction_history():
    """Check transaction history to see the profit claim"""
    print("\nChecking transaction history...")
    
    try:
        response = requests.get(
            f"{BACKEND_URL}/transactions/{USER_ADDRESS}?limit=10",
            timeout=5
        )
        
        if response.ok:
            data = response.json()
            transactions = data.get('transactions', [])
            print(f"✅ Found {len(transactions)} transactions\n")
            
            # Show profit claims
            profit_claims = [tx for tx in transactions if tx['transactionHash'].startswith('PROFIT-')]
            if profit_claims:
                print(f"💰 Profit Claims ({len(profit_claims)}):")
                for tx in profit_claims:
                    print(f"  - {tx['amountFormatted']:.6f} {tx['coinSymbol']} (TxID: {tx['transactionHash'][:30]}...)")
            
            # Show real transactions
            real_txs = [tx for tx in transactions if not tx['transactionHash'].startswith('PROFIT-')]
            if real_txs:
                print(f"\n📝 Real Transactions ({len(real_txs)}):")
                for tx in real_txs[:5]:
                    print(f"  - {tx['type']}: {tx['amountFormatted']:.2f} {tx['coinSymbol']} (TxID: {tx['transactionHash'][:20]}...)")
        else:
            print(f"❌ Failed: {response.text}")
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    print("="*60)
    print("PROFIT CLAIM TEST")
    print("="*60)
    print()
    
    # Simulate the 0.22 profit you mentioned
    profit_amount = 0.22
    
    success = log_profit_claim(profit_amount, "USDT")
    
    if success:
        check_transaction_history()
        
        print("\n" + "="*60)
        print("✅ SUCCESS!")
        print("="*60)
        print("\nHow it works:")
        print("1. Real swaps → Real TxIDs → Real explorer links ✓")
        print("2. Profit calculation → Mocked TxID → Shows in frontend ✓")
        print("3. Profit added to vault balance → Real ✓")
        print("4. Frontend displays 'Profit Claim' with special badge ✓")
        print("\nView in frontend:")
        print("  → http://localhost:8081/vault")
        print("  → Scroll to 'Transaction History'")
        print("  → Look for '💰 Profit Claim' entries")
        print("="*60)
