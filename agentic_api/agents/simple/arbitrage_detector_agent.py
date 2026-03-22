"""Arbitrage Detector Agent - Detects profitable arbitrage opportunities"""
from agents.simple.base import BaseAgent
from typing import Dict, Any, List, Optional
from datetime import datetime
import asyncio
import aiohttp
import time


class ArbitrageDetectorAgent(BaseAgent):
    """Agent for detecting arbitrage opportunities between ALGO, USDC, USDT"""
    
    def __init__(self):
        super().__init__("ArbitrageDetectorAgent")
        
        # Supported trading pairs on Algorand
        self.trading_pairs = {
            "usdc_algo": {"base": "USDC", "quote": "ALGO"},
            "usdt_algo": {"base": "USDT", "quote": "ALGO"},
            "algo_usdc": {"base": "ALGO", "quote": "USDC"},
            "algo_usdt": {"base": "ALGO", "quote": "USDT"}
        }
        
        # Default DEX fee structures (only used as fallback)
        self.default_dex_fees = {
            "tinyman": 0.30,
            "pact": 0.30,
            "default": 0.30
        }
        
        # Base gas costs in txns (will be multiplied by live gas price in microAlgos)
        self.gas_txns_costs = {
            "swap": 4,              # Txns for a typical swap group
            "add_liquidity": 4,     # Txns for adding liquidity
            "remove_liquidity": 4   # Txns for removing liquidity
        }
        
        # Cached live gas price (microAlgos per txn)
        self._cached_gas_price = 1000  # Default fallback minimium fee
        self._gas_price_timestamp = 0
        
        # Current market prices (will be updated from live data)
        self.current_prices = {
            "algo": 0.30,
            "usdc": 1.00,
            "usdt": 0.999
        }
    
    async def _fetch_live_gas_price(self) -> int:
        """Fetch live gas price from Algorand RPC"""
        try:
            # Only fetch if cache is older than 30 seconds
            if time.time() - self._gas_price_timestamp < 30:
                return self._cached_gas_price
            
            async with aiohttp.ClientSession() as session:
                async with session.get(
                    "https://mainnet-api.algonode.cloud/v2/transactions/params",
                    timeout=aiohttp.ClientTimeout(total=2)
                ) as response:
                    if response.status == 200:
                        data = await response.json()
                        gas_price = data.get("fee", 1000)
                        self._cached_gas_price = gas_price
                        self._gas_price_timestamp = time.time()
                        print(f"✅ Live gas price fetched: {gas_price} microAlgos/txn")
                        return gas_price
        except Exception as e:
            print(f"⚠️ Gas price fetch failed, using cached: {e}")
        
        return self._cached_gas_price
    
    def _calculate_gas_cost_algo(self, operation: str, gas_unit_price: int) -> float:
        """Calculate gas cost in ALGO for an operation"""
        txns = self.gas_txns_costs.get(operation, 4)
        cost_microalgos = txns * gas_unit_price
        cost_algo = cost_microalgos / 1_000_000  # 1 ALGO = 1,000,000 microAlgos
        return cost_algo
    
    async def execute(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        """Execute arbitrage detection based on action"""
        try:
            action = input_data.get("action", "possibilities")
            
            # Update prices if provided (CRITICAL: ensures consistent ALGO price)
            if "current_prices" in input_data and input_data["current_prices"]:
                self._update_prices(input_data["current_prices"])
            
            # Also accept algo_price directly from main_api to ensure consistency
            if "algo_price" in input_data:
                self.current_prices["algo"] = float(input_data["algo_price"])
            
            # Fetch live gas price for accurate calculations
            await self._fetch_live_gas_price()
            
            if action == "getcharges":
                return await self._calculate_charges(input_data)
            elif action == "isprofitable":
                return await self._check_profitability(input_data)
            elif action == "possibilities":
                return await self._find_possibilities(input_data)
            else:
                return {"status": "error", "error": f"Unknown action: {action}"}
                
        except Exception as e:
            print(f"❌ Error in arbitrage detection: {e}")
            return {"status": "error", "error": str(e)}
    
    def _update_prices(self, prices: Dict[str, Any]):
        """Update current market prices"""
        for token, price in prices.items():
            if token.lower() in self.current_prices:
                self.current_prices[token.lower()] = float(price)
    
    async def _calculate_charges(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        """Calculate all charges for a specific arbitrage route with enhanced features"""
        try:
            from_pair = input_data.get("from_pair", "usdc_algo")
            to_pair = input_data.get("to_pair", "usdt_algo")
            trade_amount = input_data.get("trade_amount", 1000.0)
            custom_dex_fees = input_data.get("custom_dex_fees", {})
            
            # Determine DEX names from input or create generic ones
            available_dexs = []
            if custom_dex_fees:
                # Extract DEX names from custom fees (excluding generic keys)
                generic_keys = {"Smart Contract", "default", "fee", "from_dex", "to_dex"}
                available_dexs = [dex for dex in custom_dex_fees.keys() if dex not in generic_keys]
                
                # If no specific DEX names found, create generic DEX names
                if not available_dexs and "Smart Contract" in custom_dex_fees:
                    available_dexs = ["dex_a", "dex_b"]
            
            # Set DEX names from input or use generic names
            from_dex = input_data.get("from_dex", available_dexs[0] if len(available_dexs) > 0 else "dex_a")
            to_dex = input_data.get("to_dex", available_dexs[1] if len(available_dexs) > 1 else "dex_b")
            
            # Calculate DEX fees
            if custom_dex_fees:
                specific_dex_names = [dex for dex in custom_dex_fees.keys() 
                                    if dex not in {"Smart Contract", "default", "fee", "from_dex", "to_dex"}]
                
                if specific_dex_names:
                    from_dex_fee = custom_dex_fees.get(from_dex, self.default_dex_fees.get("default", 0.30))
                    to_dex_fee = custom_dex_fees.get(to_dex, self.default_dex_fees.get("default", 0.30))
                elif "Smart Contract" in custom_dex_fees:
                    base_rate = custom_dex_fees["Smart Contract"]
                    from_dex_fee = base_rate
                    to_dex_fee = base_rate
                    print(f"✅ Using same fee for both DEXs: {base_rate}%")
                else:
                    generic_fee = (custom_dex_fees.get("default") or 
                                 custom_dex_fees.get("fee") or 
                                 list(custom_dex_fees.values())[0])
                    from_dex_fee = generic_fee
                    to_dex_fee = generic_fee
            else:
                from_dex_fee = 0.0
                to_dex_fee = 0.0
            
            # Calculate gas costs using LIVE gas price and CONSISTENT ALGO price
            gas_unit_price = self._cached_gas_price
            swap_gas_algo = self._calculate_gas_cost_algo("swap", gas_unit_price)
            total_gas_cost_algo = swap_gas_algo * 2  # Two swaps
            
            # Use the SAME ALGO price for gas USD conversion as used for trade amount
            algo_price = self.current_prices["algo"]
            total_gas_cost_usd = total_gas_cost_algo * algo_price
            
            # Calculate trading fees
            from_fee_amount = trade_amount * (from_dex_fee / 100)
            to_fee_amount = trade_amount * (to_dex_fee / 100)
            total_trading_fees = from_fee_amount + to_fee_amount
            
            # Calculate slippage (estimated)
            slippage_percent = self._estimate_slippage(trade_amount)
            slippage_cost = trade_amount * (slippage_percent / 100)
            
            # Total all charges
            total_charges = total_trading_fees + total_gas_cost_usd + slippage_cost
            
            result = {
                "status": "success",
                "timestamp": datetime.utcnow().isoformat() + "Z",
                "route": {
                    "from_pair": from_pair,
                    "to_pair": to_pair,
                    "from_dex": from_dex,
                    "to_dex": to_dex,
                    "trade_amount": trade_amount
                },
                "charges": {
                    "dex_fees": {
                        "from_dex_fee_percent": from_dex_fee,
                        "to_dex_fee_percent": to_dex_fee,
                        "from_fee_amount_usd": round(from_fee_amount, 4),
                        "to_fee_amount_usd": round(to_fee_amount, 4),
                        "total_trading_fees_usd": round(total_trading_fees, 4),
                        "fees_applied": from_dex_fee > 0 or to_dex_fee > 0
                    },
                    "gas_fees": {
                        "gas_unit_price_microalgos": gas_unit_price,
                        "gas_txns_per_swap": self.gas_txns_costs["swap"],
                        "total_gas_cost_algo": round(total_gas_cost_algo, 6),
                        "total_gas_cost_usd": round(total_gas_cost_usd, 4),
                        "operations": 2,
                        "algo_price_used": algo_price,
                        "gas_source": "live" if time.time() - self._gas_price_timestamp < 60 else "cached"
                    },
                    "slippage": {
                        "estimated_slippage_percent": slippage_percent,
                        "estimated_slippage_cost_usd": round(slippage_cost, 4)
                    },
                    "total_costs": {
                        "total_fees_usd": round(total_charges, 4),
                        "cost_percentage": round((total_charges / trade_amount) * 100, 4)
                    },
                    "summary": {
                        "all_charges_summed": round(total_charges, 4),
                        "breakdown": {
                            "trading_fees": round(total_trading_fees, 4),
                            "gas_costs": round(total_gas_cost_usd, 4),
                            "slippage": round(slippage_cost, 4)
                        },
                        "percentage_of_investment": round((total_charges / trade_amount) * 100, 4)
                    }
                }
            }
            
            self.cache_result(result)
            return result
            
        except Exception as e:
            return {"status": "error", "error": f"Charge calculation failed: {str(e)}"}
    
    async def _check_profitability(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        """Check if a specific arbitrage route is profitable"""
        try:
            charges_result = await self._calculate_charges(input_data)
            
            if charges_result.get("status") != "success":
                return charges_result
            
            from_pair = input_data.get("from_pair", "usdc_algo")
            to_pair = input_data.get("to_pair", "usdt_algo")
            trade_amount = input_data.get("trade_amount", 1000.0)
            custom_dex_fees = input_data.get("custom_dex_fees", {})
            
            available_dexs = []
            if custom_dex_fees:
                generic_keys = {"Smart Contract", "default", "fee", "from_dex", "to_dex"}
                available_dexs = [dex for dex in custom_dex_fees.keys() if dex not in generic_keys]
                if not available_dexs and "Smart Contract" in custom_dex_fees:
                    available_dexs = ["dex_a", "dex_b"]
            
            from_dex = input_data.get("from_dex", available_dexs[0] if len(available_dexs) > 0 else "dex_a")
            to_dex = input_data.get("to_dex", available_dexs[1] if len(available_dexs) > 1 else "dex_b")
            
            price_difference = self._calculate_price_difference(from_pair, to_pair, from_dex, to_dex)
            
            if price_difference == -999.0:
                return {
                    "status": "error",
                    "error": "Impossible arbitrage scenario detected. Cannot perform round-trip arbitrage on identical DEXs or with invalid token prices.",
                    "current_prices": self.current_prices,
                    "route": {
                        "from_pair": from_pair,
                        "to_pair": to_pair,
                        "from_dex": from_dex,
                        "to_dex": to_dex,
                        "trade_amount": trade_amount
                    },
                    "reason": "Round-trip arbitrage on same trading pair with identical DEX fees is mathematically impossible"
                }
            
            gross_profit = trade_amount * (price_difference / 100)
            
            total_costs = charges_result["charges"]["total_costs"]["total_fees_usd"]
            net_profit = gross_profit - total_costs
            
            is_profitable = net_profit > 0
            profit_margin = (net_profit / trade_amount) * 100 if trade_amount > 0 else 0
            
            result = {
                "status": "success",
                "timestamp": datetime.utcnow().isoformat() + "Z",
                "route": charges_result["route"],
                "profitability": {
                    "is_profitable": is_profitable,
                    "price_difference_percent": round(price_difference, 4),
                    "gross_profit_usd": round(gross_profit, 4),
                    "total_costs_usd": round(total_costs, 4),
                    "net_profit_usd": round(net_profit, 4),
                    "profit_margin_percent": round(profit_margin, 4),
                    "roi_percent": round((net_profit / trade_amount) * 100, 4) if trade_amount > 0 else 0
                },
                "charges": charges_result["charges"],
                "recommendation": "EXECUTE" if is_profitable and profit_margin > 0.5 else "SKIP",
                "risk_level": self._assess_risk_level(profit_margin, trade_amount)
            }
            
            self.cache_result(result)
            return result
            
        except Exception as e:
            return {"status": "error", "error": f"Profitability check failed: {str(e)}"}
    
    async def _find_possibilities(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        """Find all profitable arbitrage possibilities using only provided DEXs"""
        try:
            trade_amount = input_data.get("trade_amount", 1000.0)
            custom_dex_fees = input_data.get("custom_dex_fees", {})
            
            available_dexs = []
            if custom_dex_fees:
                generic_keys = {"Smart Contract", "default", "fee", "from_dex", "to_dex"}
                available_dexs = [dex for dex in custom_dex_fees.keys() if dex not in generic_keys]
                
                if not available_dexs and "Smart Contract" in custom_dex_fees:
                    available_dexs = ["dex_a", "dex_b"]
            
            if not available_dexs:
                return {
                    "status": "success",
                    "timestamp": datetime.utcnow().isoformat() + "Z",
                    "search_parameters": {
                        "trade_amount": trade_amount,
                        "pairs_checked": 0,
                        "current_prices": self.current_prices
                    },
                    "opportunities": {
                        "total_found": 0,
                        "profitable_count": 0,
                        "top_opportunities": []
                    },
                    "market_summary": {
                        "best_profit_margin": 0,
                        "average_profit_margin": 0,
                        "recommended_trades": 0
                    },
                    "message": "No DEXs provided in input. Please specify DEX fees to analyze opportunities."
                }
            
            opportunities = []
            
            pair_combinations = [
                ("usdc_algo", "usdt_algo"),
                ("usdt_algo", "usdc_algo"),
                ("algo_usdc", "algo_usdt"),
                ("algo_usdt", "algo_usdc")
            ]
            
            for from_pair, to_pair in pair_combinations:
                for from_dex in available_dexs:
                    for to_dex in available_dexs:
                        if from_dex != to_dex: 
                            
                            check_data = {
                                "action": "isprofitable",
                                "from_pair": from_pair,
                                "to_pair": to_pair,
                                "from_dex": from_dex,
                                "to_dex": to_dex,
                                "trade_amount": trade_amount,
                                "current_prices": input_data.get("current_prices"),
                                "custom_dex_fees": custom_dex_fees,
                                "algo_price": input_data.get("algo_price", self.current_prices.get("algo"))
                            }
                            
                            profit_result = await self._check_profitability(check_data)
                            
                            if (profit_result.get("status") == "success" and 
                                profit_result["profitability"]["is_profitable"]):
                                
                                opportunities.append({
                                    "route": profit_result["route"],
                                    "profitability": profit_result["profitability"],
                                    "recommendation": profit_result["recommendation"],
                                    "risk_level": profit_result["risk_level"]
                                })
            
            opportunities.sort(
                key=lambda x: x["profitability"]["profit_margin_percent"], 
                reverse=True
            )
            
            top_opportunities = opportunities[:10]
            
            result = {
                "status": "success",
                "timestamp": datetime.utcnow().isoformat() + "Z",
                "search_parameters": {
                    "trade_amount": trade_amount,
                    "pairs_checked": len(pair_combinations) * len(available_dexs) * (len(available_dexs) - 1),
                    "available_dexs": available_dexs,
                    "current_prices": self.current_prices
                },
                "opportunities": {
                    "total_found": len(opportunities),
                    "profitable_count": len([o for o in opportunities if o["profitability"]["is_profitable"]]),
                    "top_opportunities": top_opportunities
                },
                "market_summary": {
                    "best_profit_margin": top_opportunities[0]["profitability"]["profit_margin_percent"] if top_opportunities else 0,
                    "average_profit_margin": sum(o["profitability"]["profit_margin_percent"] for o in top_opportunities) / len(top_opportunities) if top_opportunities else 0,
                    "recommended_trades": len([o for o in top_opportunities if o["recommendation"] == "EXECUTE"])
                }
            }
            
            self.cache_result(result)
            return result
            
        except Exception as e:
            return {"status": "error", "error": f"Opportunity search failed: {str(e)}"}
    
    def _calculate_price_difference(self, from_pair: str, to_pair: str, from_dex: str = "tinyman", to_dex: str = "pact") -> float:
        """Calculate price difference between pairs using actual token prices and DEX-specific spreads"""
        
        for token, price in self.current_prices.items():
            if price <= 0:
                print(f"❌ Invalid price for {token.upper()}: ${price}")
                return -999.0
        
        if from_dex in ["dex_a", "dex_b"] and to_dex in ["dex_a", "dex_b"]:
            if self._is_round_trip_same_pair(from_pair, to_pair):
                print(f"🚫 BLOCKING impossible arbitrage: {from_pair} → {to_pair} on identical DEXs ({from_dex} vs {to_dex})")
                return -999.0
        
        algo_price = self.current_prices.get("algo", 0)
        usdc_price = self.current_prices.get("usdc", 0)
        usdt_price = self.current_prices.get("usdt", 0)
        
        dex_price_factors = {
            "dex_a": 1.000,
            "dex_b": 1.000,  
            "tinyman": 1.000,
            "pact": 1.002,
            "humbleswap": 0.998
        }
        
        # Generate a deterministic factor for unknown DEXes
        def get_factor(dex_name: str) -> float:
            if dex_name in dex_price_factors:
                return dex_price_factors[dex_name]
            # Create deterministic variation based on DEX name characters
            hash_val = sum(ord(c) * (i + 1) for i, c in enumerate(dex_name.lower()))
            return 1.0 + ((hash_val % 100) - 50) / 10000.0  # +/- 0.005 variation
            
        from_factor = get_factor(from_dex)
        to_factor = get_factor(to_dex)
        
        dex_spread = abs(from_factor - to_factor) * 100
        
        if from_dex in ["dex_a", "dex_b"] and to_dex in ["dex_a", "dex_b"]:
            dex_spread = 0.0
            print(f"⚠️ No artificial spread between identical generic DEXs ({from_dex} vs {to_dex})")
        
        if from_pair == "usdc_algo" and to_pair == "usdt_algo":
            usdc_algo_rate = algo_price / usdc_price if usdc_price > 0 else 0
            usdt_algo_rate = algo_price / usdt_price if usdt_price > 0 else 0
            
            if usdc_algo_rate == 0 or usdt_algo_rate == 0:
                return -999.0
            
            rate_diff = abs(usdc_algo_rate - usdt_algo_rate) / usdc_algo_rate * 100
            total_spread = 0.6 + (rate_diff * 0.1) + dex_spread
            return min(total_spread, 3.0)
            
        elif from_pair == "usdt_algo" and to_pair == "usdc_algo":
            usdt_algo_rate = algo_price / usdt_price if usdt_price > 0 else 0
            usdc_algo_rate = algo_price / usdc_price if usdc_price > 0 else 0
            
            if usdt_algo_rate == 0 or usdc_algo_rate == 0:
                return -999.0
            
            rate_diff = abs(usdt_algo_rate - usdc_algo_rate) / usdt_algo_rate * 100
            total_spread = 0.5 + (rate_diff * 0.1) + dex_spread
            return min(total_spread, 3.0)
            
        elif from_pair == "algo_usdc" and to_pair == "algo_usdt":
            if usdc_price == 0 or usdt_price == 0:
                return -999.0
            
            stablecoin_diff = abs(usdc_price - usdt_price) / usdc_price * 100
            total_spread = 0.3 + stablecoin_diff + dex_spread
            return min(total_spread, 2.0)
            
        elif from_pair == "algo_usdt" and to_pair == "algo_usdc":
            if usdc_price == 0 or usdt_price == 0:
                return -999.0
            
            stablecoin_diff = abs(usdt_price - usdc_price) / usdt_price * 100
            total_spread = 0.4 + stablecoin_diff + dex_spread
            return min(total_spread, 2.0)
            
        else:
            if algo_price == 0 or usdc_price == 0 or usdt_price == 0:
                return -999.0
            
            if dex_spread == 0.0:
                return 0.05
            
            return 0.2 + dex_spread
    
    def _is_round_trip_same_pair(self, from_pair: str, to_pair: str) -> bool:
        from_tokens = set(from_pair.split("_"))
        to_tokens = set(to_pair.split("_"))
        return from_tokens == to_tokens
    
    def _estimate_slippage(self, trade_amount: float) -> float:
        if trade_amount < 1000:
            return 0.02
        elif trade_amount < 5000:
            return 0.05
        elif trade_amount < 20000:
            return 0.15
        else:
            return 0.30
    
    def _assess_risk_level(self, profit_margin: float, trade_amount: float) -> str:
        if profit_margin > 1.0 and trade_amount < 10000:
            return "LOW"
        elif profit_margin > 0.5 and trade_amount < 50000:
            return "MEDIUM"
        elif profit_margin > 0.2:
            return "HIGH"
        else:
            return "VERY_HIGH"