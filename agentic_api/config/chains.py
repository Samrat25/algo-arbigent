"""Algorand Chain Configuration - ALGO, USDC, USDT Focus"""

# Algorand Mainnet Configuration
ALGORAND_CONFIG = {
    "chain_id": "mainnet",
    "name": "Algorand Mainnet",
    "rpc_url": "https://mainnet-api.algonode.cloud",
    "indexer_url": "https://mainnet-idx.algonode.cloud",
    "explorer_url": "https://algoexplorer.io",
    "native_token": "ALGO",
    "decimals": 6
}

# Supported Tokens on Algorand
ALGORAND_TOKENS = {
    "ALGO": {
        "symbol": "ALGO",
        "name": "Algorand",
        "address": "0",
        "decimals": 6,
        "is_native": True,
        "coingecko_id": "algorand"
    },
    "USDC": {
        "symbol": "USDC",
        "name": "USD Coin",
        "address": "31566704",
        "decimals": 6,
        "is_native": False,
        "coingecko_id": "usd-coin"
    },
    "USDT": {
        "symbol": "USDT", 
        "name": "Tether USD",
        "address": "312769",
        "decimals": 6,
        "is_native": False,
        "coingecko_id": "tether"
    }
}

# Algorand DEX Configuration
ALGORAND_DEXS = {
    "tinyman": {
        "name": "Tinyman",
        "fee": 0.30,  # 0.30%
        "router_address": "unknown",
        "factory_address": "unknown",
        "supported_pairs": ["ALGO-USDC", "ALGO-USDT", "USDC-USDT"]
    },
    "pact": {
        "name": "Pact",
        "fee": 0.30,  # 0.30%
        "router_address": "unknown",
        "factory_address": "unknown",
        "supported_pairs": ["ALGO-USDC", "ALGO-USDT", "USDC-USDT"]
    },
    "humbleswap": {
        "name": "HumbleSwap",
        "fee": 0.25,  # 0.25%
        "router_address": "unknown",
        "factory_address": "unknown",
        "supported_pairs": ["ALGO-USDC", "ALGO-USDT", "USDC-USDT"]
    }
}

# Trading Pairs Configuration
TRADING_PAIRS = {
    "ALGO-USDC": {
        "base": "ALGO",
        "quote": "USDC",
        "pair_address": "unknown",
        "available_dexs": ["tinyman", "pact", "humbleswap"]
    },
    "ALGO-USDT": {
        "base": "ALGO", 
        "quote": "USDT",
        "pair_address": "unknown",
        "available_dexs": ["tinyman", "pact", "humbleswap"]
    },
    "USDC-USDT": {
        "base": "USDC",
        "quote": "USDT", 
        "pair_address": "unknown",
        "available_dexs": ["tinyman", "pact", "humbleswap"]
    }
}

# Gas Configuration for Algorand
GAS_CONFIG = {
    "max_gas_amount": 2000,
    "gas_unit_price": 1000,  # in microAlgos
    "gas_currency": "ALGO",
    "typical_swap_gas": 1000,
    "typical_add_liquidity_gas": 2000,
    "typical_remove_liquidity_gas": 2000
}

# API Endpoints
API_ENDPOINTS = {
    "price_feeds": {
        "coingecko": "https://api.coingecko.com/api/v3/simple/price",
        "binance": "https://api.binance.com/api/v3/ticker/24hr",
        "coinbase": "https://api.coinbase.com/v2/exchange-rates"
    },
    "algorand_rpc": {
        "mainnet": "https://mainnet-api.algonode.cloud",
        "testnet": "https://testnet-api.algonode.cloud",
        "devnet": "http://localhost:4001"
    },
    "defi_data": {
        "defillama": "https://api.llama.fi",
        "dexscreener": "https://api.dexscreener.com/latest/dex"
    }
}

# Arbitrage Configuration
ARBITRAGE_CONFIG = {
    "min_profit_threshold": 0.1,  # 0.1% minimum profit
    "max_slippage": 1.0,          # 1.0% max slippage
    "default_trade_amount": 1000,  # $1000 default
    "supported_routes": [
        "ALGO -> USDC -> ALGO",
        "ALGO -> USDT -> ALGO", 
        "USDC -> ALGO -> USDT",
        "USDT -> ALGO -> USDC"
    ]
}

# Export main configuration
CHAINS = {
    "algorand": ALGORAND_CONFIG
}

TOKENS = ALGORAND_TOKENS
DEXS = ALGORAND_DEXS

# Legacy compatibility
SUPPORTED_CHAINS = ["algorand"]
SUPPORTED_CURRENCIES = ["algo", "usdc", "usdt"]
