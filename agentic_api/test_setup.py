"""
Test script to verify bot setup and configuration
"""
import asyncio
import os
import sys
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

async def test_imports():
    """Test if all required packages are installed"""
    print("Testing imports...")
    
    try:
        import algosdk
        print("✅ algosdk installed")
    except ImportError:
        print("❌ algosdk not installed - run: pip install py-algorand-sdk")
        return False
    
    try:
        import aiohttp
        print("✅ aiohttp installed")
    except ImportError:
        print("❌ aiohttp not installed - run: pip install aiohttp")
        return False
    
    try:
        import fastapi
        print("✅ fastapi installed")
    except ImportError:
        print("❌ fastapi not installed - run: pip install fastapi")
        return False
    
    return True

async def test_environment():
    """Test if environment variables are configured"""
    print("\nTesting environment configuration...")
    
    required_vars = [
        'APP_ID',
        'USDC_ASSET_ID',
        'USDT_ASSET_ID',
        'USER_MNEMONIC'
    ]
    
    all_set = True
    for var in required_vars:
        value = os.getenv(var)
        if value and value != f"your {var.lower().replace('_', ' ')} here":
            print(f"✅ {var} is set")
        else:
            print(f"❌ {var} is not set or using default value")
            all_set = False
    
    return all_set

async def test_algorand_connection():
    """Test connection to Algorand network"""
    print("\nTesting Algorand connection...")
    
    try:
        import algosdk
        
        algod_client = algosdk.Algodv2('', 'https://testnet-api.algonode.cloud', '')
        status = algod_client.status()
        
        print(f"✅ Connected to Algorand testnet")
        print(f"   Last round: {status['last-round']}")
        return True
    except Exception as e:
        print(f"❌ Failed to connect to Algorand: {e}")
        return False

async def test_wallet():
    """Test wallet configuration"""
    print("\nTesting wallet configuration...")
    
    try:
        import algosdk
        
        user_mnemonic = os.getenv('USER_MNEMONIC')
        
        if not user_mnemonic or 'your wallet mnemonic' in user_mnemonic:
            print("❌ USER_MNEMONIC not configured in .env")
            return False
        
        # Try to convert mnemonic to account
        try:
            private_key = algosdk.mnemonic.to_private_key(user_mnemonic)
            address = algosdk.account.address_from_private_key(private_key)
            print(f"✅ Wallet configured")
            print(f"   Address: {address}")
            
            # Check balance
            algod_client = algosdk.Algodv2('', 'https://testnet-api.algonode.cloud', '')
            account_info = algod_client.account_information(address)
            balance = account_info['amount'] / 1_000_000
            
            print(f"   Balance: {balance:.2f} ALGO")
            
            if balance < 0.1:
                print("⚠️  Low balance - get testnet ALGO from faucet")
                print("   https://testnet.algoexplorer.io/dispenser")
            
            return True
        except Exception as e:
            print(f"❌ Invalid mnemonic: {e}")
            return False
            
    except Exception as e:
        print(f"❌ Wallet test failed: {e}")
        return False

async def test_contract_optin():
    """Test if wallet is opted into contract"""
    print("\nTesting contract opt-in status...")
    
    try:
        import algosdk
        
        user_mnemonic = os.getenv('USER_MNEMONIC')
        app_id = int(os.getenv('APP_ID', '0'))
        
        if not user_mnemonic or 'your wallet mnemonic' in user_mnemonic:
            print("⚠️  Skipping - wallet not configured")
            return False
        
        private_key = algosdk.mnemonic.to_private_key(user_mnemonic)
        address = algosdk.account.address_from_private_key(private_key)
        
        algod_client = algosdk.Algodv2('', 'https://testnet-api.algonode.cloud', '')
        account_info = algod_client.account_information(address)
        
        apps_local_state = account_info.get('apps-local-state', [])
        opted_in = any(app['id'] == app_id for app in apps_local_state)
        
        if opted_in:
            print(f"✅ Opted into contract (App ID: {app_id})")
            
            # Check vault balances
            app_state = next((app for app in apps_local_state if app['id'] == app_id), None)
            if app_state:
                print("   Vault balances:")
                for kv in app_state.get('key-value', []):
                    try:
                        import base64
                        key_str = base64.b64decode(kv['key']).decode('utf-8', errors='ignore')
                        value = kv['value'].get('uint', 0) / 1_000_000
                        
                        if 'balance' in key_str:
                            print(f"   - {key_str}: {value:.2f}")
                    except:
                        pass
            
            return True
        else:
            print(f"❌ Not opted into contract (App ID: {app_id})")
            print("   Run opt-in script: python algorand_contracts/optin_contract_simple.py")
            return False
            
    except Exception as e:
        print(f"❌ Contract opt-in test failed: {e}")
        return False

async def test_agentic_api():
    """Test if agentic API is accessible"""
    print("\nTesting agentic API connection...")
    
    try:
        import aiohttp
        
        api_url = os.getenv('AGENTIC_API_URL', 'http://localhost:8000')
        
        async with aiohttp.ClientSession() as session:
            try:
                async with session.get(
                    f"{api_url}/health",
                    timeout=aiohttp.ClientTimeout(total=5)
                ) as response:
                    if response.status == 200:
                        data = await response.json()
                        print(f"✅ Agentic API is running")
                        print(f"   Status: {data.get('status')}")
                        print(f"   AI Agent: {data.get('ai_agent')}")
                        return True
                    else:
                        print(f"❌ Agentic API returned status {response.status}")
                        return False
            except asyncio.TimeoutError:
                print(f"❌ Agentic API not responding at {api_url}")
                print("   Start it with: python app.py")
                return False
            except aiohttp.ClientConnectorError:
                print(f"❌ Cannot connect to agentic API at {api_url}")
                print("   Start it with: python app.py")
                return False
                
    except Exception as e:
        print(f"❌ Agentic API test failed: {e}")
        return False

async def test_backend_api():
    """Test if backend API is accessible"""
    print("\nTesting backend API connection...")
    
    try:
        import aiohttp
        
        api_url = os.getenv('BACKEND_API_URL', 'http://localhost:3001')
        
        async with aiohttp.ClientSession() as session:
            try:
                async with session.get(
                    f"{api_url}/api/health",
                    timeout=aiohttp.ClientTimeout(total=5)
                ) as response:
                    if response.status == 200:
                        data = await response.json()
                        print(f"✅ Backend API is running")
                        print(f"   Status: {data.get('status')}")
                        print(f"   Network: {data.get('network')}")
                        return True
                    else:
                        print(f"⚠️  Backend API returned status {response.status}")
                        return False
            except (asyncio.TimeoutError, aiohttp.ClientConnectorError):
                print(f"⚠️  Backend API not responding at {api_url}")
                print("   (Optional) Start it with: cd backend && node server_algorand.js")
                return False
                
    except Exception as e:
        print(f"⚠️  Backend API test failed: {e}")
        print("   (This is optional for bot operation)")
        return False

async def main():
    """Run all tests"""
    print("="*60)
    print("Algorand Arbitrage Bot - Setup Test")
    print("="*60)
    print()
    
    results = []
    
    # Critical tests
    results.append(("Imports", await test_imports()))
    results.append(("Environment", await test_environment()))
    results.append(("Algorand Connection", await test_algorand_connection()))
    results.append(("Wallet", await test_wallet()))
    results.append(("Contract Opt-in", await test_contract_optin()))
    results.append(("Agentic API", await test_agentic_api()))
    
    # Optional test
    results.append(("Backend API", await test_backend_api()))
    
    print("\n" + "="*60)
    print("Test Summary")
    print("="*60)
    
    for test_name, passed in results:
        status = "✅ PASS" if passed else "❌ FAIL"
        print(f"{status} - {test_name}")
    
    critical_tests = results[:-1]  # All except backend
    all_critical_passed = all(result[1] for result in critical_tests)
    
    print("\n" + "="*60)
    if all_critical_passed:
        print("✅ All critical tests passed!")
        print("You can now run the bot with: python arbitrage_bot.py")
    else:
        print("❌ Some critical tests failed")
        print("Please fix the issues above before running the bot")
    print("="*60)
    
    return all_critical_passed

if __name__ == "__main__":
    success = asyncio.run(main())
    sys.exit(0 if success else 1)
