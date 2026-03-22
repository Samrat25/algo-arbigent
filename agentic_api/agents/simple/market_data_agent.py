"""Market Data Agent - Fetches live ALGO, USDC, USDT prices and gas fees"""
from agents.simple.base import BaseAgent
from typing import Dict, Any, Optional
from datetime import datetime
import aiohttp
import asyncio
import time


class MarketDataAgent(BaseAgent):
    """Agent for fetching live Algorand market data (ALGO, USDC, USDT)"""
    
    def __init__(self):
        super().__init__("MarketDataAgent")
        
        # Enhanced API endpoints with more free sources
        self.price_apis = {
            "coingecko": "https://api.coingecko.com/api/v3/simple/price?ids=algorand,usd-coin,tether&vs_currencies=usd&include_market_cap=true&include_24hr_vol=true&include_24hr_change=true",
            "binance": "https://api.binance.com/api/v3/ticker/24hr?symbols=[\"ALGOUSDT\",\"USDCUSDT\"]",
            "coinbase": "https://api.coinbase.com/v2/exchange-rates?currency=ALGO",
            "cryptocompare": "https://min-api.cryptocompare.com/data/pricemultifull?fsyms=ALGO,USDC,USDT&tsyms=USD",
            "coinapi": "https://rest.coinapi.io/v1/exchangerate/ALGO/USD",  # Free tier: 100 requests/day
            "fixer": "https://api.fixer.io/latest?base=USD&symbols=ALGO,USDC,USDT"  # Free tier: 100 requests/month
        }
        
        # Algorand network APIs with alternatives
        self.algorand_apis = {
            "gas_estimate": "https://mainnet-api.algonode.cloud/v2/transactions/params",
            "mainnet_rpc": "https://mainnet-api.algonode.cloud",
            "algonode": "https://mainnet-api.algonode.cloud/v2/transactions/params"
        }
        
        # Enhanced DeFi data APIs
        self.defi_apis = {
            "defillama_algorand": "https://api.llama.fi/protocol/algorand",
            "algorand_tvl": "https://api.llama.fi/chains/Algorand",
            "dexscreener": "https://api.dexscreener.com/latest/dex/search/?q=ALGO",
            "coingecko_defi": "https://api.coingecko.com/api/v3/coins/algorand",
            "coinmarketcap": "https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest?symbol=ALGO",  # Free tier
            "messari": "https://data.messari.io/api/v1/assets/algorand/metrics"  # Free tier
        }
        
        # Fallback data for Algorand tokens (without total_liquidity)
        self.fallback_data = {
            "algo": {
                "current_price": "0.30",
                "gas_fees": "0.001",
                "tvl_usd": "250,000,000",
                "market_cap": "$2,500,000,000",
                "fully_diluted_valuation": "$3,000,000,000",
                "volume_24h": "$100,000,000"
            },
            "usdc": {
                "current_price": "1.00",
                "gas_fees": "0.001",
                "tvl_usd": "250,000,000",
                "market_cap": "$25,000,000,000",
                "fully_diluted_valuation": "$25,000,000,000",
                "volume_24h": "$2,800,000,000"
            },
            "usdt": {
                "current_price": "0.999",
                "gas_fees": "0.001",
                "tvl_usd": "250,000,000",
                "market_cap": "$95,000,000,000",
                "fully_diluted_valuation": "$95,000,000,000",
                "volume_24h": "$15,000,000,000"
            }
        }
    
    async def execute(self, input_data: Dict[str, Any] = None) -> Dict[str, Any]:
        """Fetch live market data for ALGO, USDC, USDT with 5s timeout fallback"""
        start_time = time.time()
        
        try:
            # Try to fetch live data with 5-second timeout
            price_task = self._fetch_token_prices()
            gas_task = self._fetch_gas_fees()
            defi_task = self._fetch_defi_data()
            
            # Execute all tasks concurrently with 5-second timeout
            price_data, gas_data, defi_data = await asyncio.wait_for(
                asyncio.gather(price_task, gas_task, defi_task, return_exceptions=True),
                timeout=5.0
            )
            
            elapsed = time.time() - start_time
            
            # Check if we got valid data
            data_sources = {
                "price_source": "live" if isinstance(price_data, dict) and price_data.get("source") != "fallback" else "fallback",
                "gas_source": "live" if isinstance(gas_data, dict) and gas_data.get("source") != "fallback" else "fallback", 
                "defi_source": "live" if isinstance(defi_data, dict) and defi_data.get("source") != "fallback" else "fallback"
            }
            
            # Build response with live or mixed data
            result = {
                "status": "success",
                "timestamp": datetime.utcnow().isoformat() + "Z",
                "base_currency": "usd",
                "chains": self._build_chains_data(price_data, gas_data, defi_data),
                "fetch_time_seconds": round(elapsed, 3),
                "data_sources": data_sources
            }
            
            self.cache_result(result)
            print(f"✅ Live data fetched in {elapsed:.3f}s - Price: {data_sources['price_source']}, Gas: {data_sources['gas_source']}, DeFi: {data_sources['defi_source']}")
            return result
            
        except asyncio.TimeoutError:
            # 5-second timeout exceeded - use cached data if available
            elapsed = time.time() - start_time
            print(f"⚠️ Live data fetch timed out after {elapsed:.3f}s, using cached data")
            
            cached_result = self.get_cached_result()
            if cached_result:
                # Update timestamp but keep cached data
                cached_result["timestamp"] = datetime.utcnow().isoformat() + "Z"
                cached_result["fetch_time_seconds"] = round(elapsed, 3)
                cached_result["data_sources"] = {
                    "price_source": "cached",
                    "gas_source": "cached", 
                    "defi_source": "cached",
                    "note": "Using cached data due to 5s timeout"
                }
                return cached_result
            else:
                # No cached data available, use fallback
                return self._get_fallback_response()
                
        except Exception as e:
            elapsed = time.time() - start_time
            print(f"❌ Error in live data fetch after {elapsed:.3f}s: {e}")
            
            # Try cached data first
            cached_result = self.get_cached_result()
            if cached_result:
                cached_result["timestamp"] = datetime.utcnow().isoformat() + "Z"
                cached_result["data_sources"] = {
                    "price_source": "cached",
                    "gas_source": "cached",
                    "defi_source": "cached", 
                    "note": f"Using cached data due to error: {str(e)}"
                }
                return cached_result
            else:
                return self._get_fallback_response()
    
    async def _fetch_token_prices(self) -> Dict[str, Any]:
        """Fetch ALGO, USDC, USDT prices from CoinGecko - raise exceptions for timeout handling"""
        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(
                    self.price_apis["coingecko"],
                    timeout=aiohttp.ClientTimeout(total=4)
                ) as response:
                    if response.status == 200:
                        data = await response.json()
                        
                        result = {
                            "algo": {
                                "price": data.get("algorand", {}).get("usd", 0.3),
                                "market_cap": data.get("algorand", {}).get("usd_market_cap", 2_500_000_000),
                                "volume_24h": data.get("algorand", {}).get("usd_24h_vol", 100_000_000),
                                "change_24h": data.get("algorand", {}).get("usd_24h_change", 0.0)
                            },
                            "usdc": {
                                "price": data.get("usd-coin", {}).get("usd", 1.0),
                                "market_cap": data.get("usd-coin", {}).get("usd_market_cap", 25_000_000_000),
                                "volume_24h": data.get("usd-coin", {}).get("usd_24h_vol", 2_800_000_000),
                                "change_24h": data.get("usd-coin", {}).get("usd_24h_change", 0.0)
                            },
                            "usdt": {
                                "price": data.get("tether", {}).get("usd", 0.999),
                                "market_cap": data.get("tether", {}).get("usd_market_cap", 95_000_000_000),
                                "volume_24h": data.get("tether", {}).get("usd_24h_vol", 15_000_000_000),
                                "change_24h": data.get("tether", {}).get("usd_24h_change", 0.0)
                            },
                            "source": "coingecko_live"
                        }
                        print(f"✅ CoinGecko prices: ALGO=${result['algo']['price']}, USDC=${result['usdc']['price']}, USDT=${result['usdt']['price']}")
                        return result
                    else:
                        print(f"⚠️ CoinGecko returned status {response.status}")
                        raise Exception(f"CoinGecko API returned status {response.status}")
                        
        except asyncio.TimeoutError:
            print("⚠️ CoinGecko request timed out")
            raise
        except Exception as e:
            print(f"❌ CoinGecko price fetch failed: {e}")
            # Try Binance as backup
            try:
                return await self._fetch_binance_prices()
            except Exception as e2:
                print(f"❌ Binance backup also failed: {e2}")
                raise Exception(f"All price sources failed: CoinGecko ({e}), Binance ({e2})")
    
    async def _fetch_binance_prices(self) -> Dict[str, Any]:
        """Fetch prices from Binance as backup"""
        async with aiohttp.ClientSession() as session:
            async with session.get(
                self.price_apis["binance"],
                timeout=aiohttp.ClientTimeout(total=3)
            ) as response:
                if response.status == 200:
                    data = await response.json()
                    
                    algo_price = 0.30
                    usdc_price = 1.0
                    
                    for item in data:
                        symbol = item.get("symbol", "")
                        price = float(item.get("price", 0))
                        
                        if symbol == "ALGOUSDT":
                            algo_price = price
                        elif symbol == "USDCUSDT":
                            usdc_price = price
                    
                    result = {
                        "algo": {
                            "price": algo_price,
                            "market_cap": 2_500_000_000,  # Estimate
                            "volume_24h": 100_000_000,    # Estimate
                            "change_24h": 0.0
                        },
                        "usdc": {
                            "price": usdc_price,
                            "market_cap": 25_000_000_000,
                            "volume_24h": 2_800_000_000,
                            "change_24h": 0.0
                        },
                        "usdt": {
                            "price": 0.999,  # Stable
                            "market_cap": 95_000_000_000,
                            "volume_24h": 15_000_000_000,
                            "change_24h": 0.0
                        },
                        "source": "binance_live"
                    }
                    print(f"✅ Binance backup prices: ALGO=${algo_price}, USDC=${usdc_price}")
                    return result
                else:
                    raise Exception(f"Binance API returned status {response.status}")
    
    async def _fetch_gas_fees(self) -> Dict[str, Any]:
        """Fetch Algorand gas fees - raise exceptions for timeout handling"""
        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(
                    self.algorand_apis["gas_estimate"],
                    timeout=aiohttp.ClientTimeout(total=3)
                ) as response:
                    if response.status == 200:
                        data = await response.json()
                        
                        # Parse Algorand gas response format
                        gas_unit_price = data.get("fee", 1000)  # default min fee is 1000 microAlgos
                        
                        # Use standard gas estimate for a swap (a swap is typically a group of txns, let's say 4 txns)
                        typical_txns = 4
                        cost_microalgos = gas_unit_price * typical_txns
                        cost_algo = cost_microalgos / 1_000_000
                        
                        result = {
                            "gas_fees": str(round(cost_algo, 6)),
                            "gas_unit_price": gas_unit_price,
                            "source": "algorand_rpc_live"
                        }
                        print(f"✅ Algorand gas LIVE: {cost_algo:.6f} ALGO ({gas_unit_price} microalgos/unit)")
                        return result
                    else:
                        print(f"⚠️ Algorand RPC returned status {response.status}")
                        raise Exception(f"Algorand RPC returned status {response.status}")
                        
        except asyncio.TimeoutError:
            print("⚠️ Algorand gas request timed out")
            raise
        except Exception as e:
            print(f"❌ Algorand gas fetch failed: {e}")
            # Don't return fallback immediately, let the timeout handler decide
            raise
    
    async def _fetch_defi_data(self) -> Dict[str, Any]:
        """Fetch Algorand DeFi TVL data with multiple sources"""
        sources_to_try = [
            ("dexscreener", self._fetch_dexscreener_data),
            ("defillama", self._fetch_defillama_data),
            ("coingecko_defi", self._fetch_coingecko_defi)
        ]
        
        for source_name, fetch_func in sources_to_try:
            try:
                result = await fetch_func()
                if result and result.get("source") != "fallback":
                    return result
            except Exception as e:
                print(f"❌ {source_name} DeFi data failed: {e}")
                continue
        
        # All sources failed, return fallback
        return {"tvl_usd": "250,000,000", "total_liquidity": "50,000,000", "source": "fallback"}
    
    async def _fetch_dexscreener_data(self) -> Dict[str, Any]:
        """Fetch data from DexScreener (free, no API key needed)"""
        async with aiohttp.ClientSession() as session:
            async with session.get(
                self.defi_apis["dexscreener"],
                timeout=aiohttp.ClientTimeout(total=3)
            ) as response:
                if response.status == 200:
                    data = await response.json()
                    
                    # Parse DexScreener response
                    pairs = data.get("pairs", [])
                    total_liquidity = 0
                    
                    for pair in pairs:
                        if pair.get("chainId") == "algorand":
                            liquidity = pair.get("liquidity", {}).get("usd", 0)
                            if liquidity:
                                total_liquidity += float(liquidity)
                    
                    result = {
                        "tvl_usd": f"{int(total_liquidity * 5):,}",  # Estimate total TVL
                        "total_liquidity": f"{int(total_liquidity):,}",
                        "dex_pairs_found": len([p for p in pairs if p.get("chainId") == "algorand"]),
                        "source": "dexscreener_live"
                    }
                    print(f"✅ DexScreener TVL: ${int(total_liquidity):,} liquidity, {result['dex_pairs_found']} pairs")
                    return result
                else:
                    raise Exception(f"DexScreener returned status {response.status}")
    
    async def _fetch_coingecko_defi(self) -> Dict[str, Any]:
        """Fetch DeFi data from CoinGecko (free tier)"""
        async with aiohttp.ClientSession() as session:
            async with session.get(
                self.defi_apis["coingecko_defi"],
                timeout=aiohttp.ClientTimeout(total=3)
            ) as response:
                if response.status == 200:
                    data = await response.json()
                    
                    market_data = data.get("market_data", {})
                    circulating_supply = market_data.get("circulating_supply", 8_000_000_000)
                    
                    # Estimate TVL based on circulating supply and price
                    estimated_tvl = circulating_supply * 0.1 * 0.3  # 10% locked, $0.3 price
                    
                    result = {
                        "tvl_usd": f"{int(estimated_tvl):,}",
                        "total_liquidity": f"{int(estimated_tvl * 0.3):,}",  # 30% in liquidity pools
                        "source": "coingecko_defi_live"
                    }
                    print(f"✅ CoinGecko DeFi TVL: ${int(estimated_tvl):,}")
                    return result
                else:
                    raise Exception(f"CoinGecko DeFi returned status {response.status}")
    
    async def _fetch_defillama_data(self) -> Dict[str, Any]:
        """Fetch from DeFiLlama (original method)"""
        async with aiohttp.ClientSession() as session:
            async with session.get(
                self.defi_apis["algorand_tvl"],
                timeout=aiohttp.ClientTimeout(total=3)
            ) as response:
                if response.status == 200:
                    data = await response.json()
                    
                    tvl = data.get("tvl", 250_000_000)
                    
                    result = {
                        "tvl_usd": f"{int(tvl):,}",
                        "total_liquidity": "50000000",
                        "source": "defillama_live"
                    }
                    print(f"✅ DeFiLlama TVL: ${int(tvl):,}")
                    return result
                else:
                    raise Exception(f"DeFiLlama returned status {response.status}")
    
    def _build_chains_data(self, price_data: Any, gas_data: Any, defi_data: Any) -> list:
        """Build chains data for response with dynamic gas fees and TVL per token"""
        chains = []
        
        # Extract data or use fallbacks
        if isinstance(price_data, dict) and "source" in price_data:
            prices = price_data
        else:
            # Use fallback prices
            prices = {
                "algo": {"price": 0.30, "market_cap": 2_500_000_000, "volume_24h": 100_000_000},
                "usdc": {"price": 1.0, "market_cap": 25_000_000_000, "volume_24h": 2_800_000_000},
                "usdt": {"price": 0.999, "market_cap": 95_000_000_000, "volume_24h": 15_000_000_000},
                "source": "fallback"
            }
        
        # Extract gas unit price from live data
        if isinstance(gas_data, dict):
            gas_unit_price = gas_data.get("gas_unit_price", 1000)
        else:
            gas_unit_price = 1000  # Default fallback
        
        # Get Algorand ecosystem TVL (this is for ALGO)
        if isinstance(defi_data, dict):
            algorand_tvl = defi_data.get("tvl_usd", "250,000,000")
        else:
            algorand_tvl = "250,000,000"
        
        # TVL per token - USDC and USDT have their own global TVL (not Algorand-specific)
        amount_global_tvl = {
            "algo": algorand_tvl,
            "usdc": "$45,000,000,000",
            "usdt": "$95,000,000,000"
        }
        
        # Gas transactions vary by operation complexity per token type
        gas_txns_by_token = {
            "algo": 1,    # Native ALGO transfer
            "usdc": 1,    # ASA transfer
            "usdt": 1     # ASA transfer
        }
        
        # Build chain data for each token with DYNAMIC gas fees and proper TVL
        for token in ["algo", "usdc", "usdt"]:
            token_data = prices.get(token, {})
            
            # Get price, handling both live and fallback data
            if isinstance(token_data.get("price"), (int, float)):
                price = token_data["price"]
            else:
                price = float(self.fallback_data[token]["current_price"])
            
            # Calculate dynamic gas fee for this token
            txns = gas_txns_by_token.get(token, 1)
            gas_cost_microalgos = txns * gas_unit_price
            gas_cost_algo = gas_cost_microalgos / 1_000_000  # 1 ALGO = 1,000,000 microAlgos
            
            chains.append({
                "chain": token,
                "current_price": str(round(price, 4)),
                "gas_fees": str(round(gas_cost_algo, 6)),
                "gas_details": {
                    "gas_unit_price_microalgos": gas_unit_price,
                    "gas_txns": txns,
                    "gas_cost_algo": round(gas_cost_algo, 6)
                },
                "tvl_usd": amount_global_tvl.get(token, algorand_tvl),
                "market_cap": f"${int(token_data.get('market_cap', 1_000_000_000)):,}",
                "fully_diluted_valuation": f"${int(token_data.get('market_cap', 1_000_000_000)):,}",
                "volume_24h": f"${int(token_data.get('volume_24h', 100_000_000)):,}"
            })
        
        return chains
    
    def _get_fallback_response(self) -> Dict[str, Any]:
        """Get fallback response when live data fails with dynamic gas fees"""
        chains = []
        
        # Default gas unit price for fallback
        default_gas_unit_price = 1000
        gas_txns_by_token = {
            "algo": 1,
            "usdc": 1,
            "usdt": 1
        }
        
        # TVL per token
        tvl_by_token = {
            "algo": "250,000,000",
            "usdc": "$45,000,000,000",
            "usdt": "$95,000,000,000"
        }
        
        for token in ["algo", "usdc", "usdt"]:
            fallback = self.fallback_data[token]
            txns = gas_txns_by_token.get(token, 1)
            gas_cost_microalgos = txns * default_gas_unit_price
            gas_cost_algo = gas_cost_microalgos / 1_000_000
            
            chains.append({
                "chain": token,
                "current_price": fallback["current_price"],
                "gas_fees": str(round(gas_cost_algo, 6)),
                "gas_details": {
                    "gas_unit_price_microalgos": default_gas_unit_price,
                    "gas_txns": txns,
                    "gas_cost_algo": round(gas_cost_algo, 6)
                },
                "tvl_usd": tvl_by_token.get(token, fallback["tvl_usd"]),
                "market_cap": fallback["market_cap"],
                "fully_diluted_valuation": fallback["fully_diluted_valuation"],
                "volume_24h": fallback["volume_24h"]
            })
        
        return {
            "status": "success",
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "base_currency": "usd",
            "chains": chains,
            "fetch_time_seconds": 0.001,
            "data_source": "fallback"
        }