import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { 
  ArrowLeft, Play, Square, Settings, Wallet, 
  Activity, Shield, RefreshCw
} from "lucide-react";
import Navbar from "@/components/Navbar";
import ShapeGrid from "@/components/ShapeGrid";
import PriceChart from "@/components/PriceChart";
import Terminal from "@/components/Terminal";
import CryptoLogo from "@/components/CryptoLogo";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { useAlgorandWallet } from '@/contexts/AlgorandWalletContext';
import { apiService } from "@/services/ApiService";
import { useLivePrices } from "@/hooks/useLivePrices";
import { useArbiGent } from "@/hooks/useArbiGent";
import { RiskLevel } from "@/services/ArbiGentService";

interface VaultTokenBalance {
  token: 'APT' | 'USDC' | 'USDT' | 'ALGO';
  amount: string;
  usdValue: string;
  walletAmount?: string; // NEW: Wallet balance
  walletUsdValue?: string; // NEW: Wallet balance in USD
}

const USDC_ASSET_ID = parseInt(import.meta.env.VITE_USDC_ASSET_ID || '0');
const USDT_ASSET_ID = parseInt(import.meta.env.VITE_USDT_ASSET_ID || '0');

// Global Background matching the rest of the page
const GlobalBackground = () => (
  <div className="fixed inset-0 z-0 opacity-40 pointer-events-none">
    <ShapeGrid 
      speed={0}
      squareSize={77}
      direction="diagonal"
      borderColor="#271E37"
      hoverFillColor="#222222"
      shape="square"
      hoverTrailAmount={0}
    />
    {/* Purple glow orbs */}
    <div className="absolute top-1/4 right-1/3 w-[500px] h-[500px] rounded-full bg-primary/8 blur-[120px] pointer-events-none" />
    <div className="absolute bottom-0 left-1/4 w-[400px] h-[400px] rounded-full bg-primary/5 blur-[100px] pointer-events-none" />
  </div>
);

const Agents = () => {
  const [minProfit, setMinProfit] = useState([0.0001]);
  const [selectedPair, setSelectedPair] = useState("AUTO");
  const [riskLevel, setRiskLevel] = useState<RiskLevel>("MEDIUM");
  const [investedAmount, setInvestedAmount] = useState([100]); // Default $100
  const [useFixedAmount, setUseFixedAmount] = useState(false); // Toggle for fixed vs automatic
  const [vaultBalances, setVaultBalances] = useState<VaultTokenBalance[]>([]);
  const [totalUsdValue, setTotalUsdValue] = useState("0.00");
  const [isLoadingVault, setIsLoadingVault] = useState(false);
  
  const { account, connected } = useAlgorandWallet();
  const { prices } = useLivePrices(1000);
  
  // ArbiGent hook
  const {
    isRunning,
    logs,
    agentState,
    runningDuration,
    startAgent,
    stopAgent,
    clearLogs,
    updateConfig,
    updateVaultBalances: updateAgentVaultBalances,
    updatePrices,
    setWalletAddress,
  } = useArbiGent();
  
  const pairs = [
    { value: "USDC_APT", label: "USDC → APT" },
    { value: "APT_USDT", label: "APT → USDT" },
    { value: "USDC_USDT", label: "USDC → USDT" },
    { value: "AUTO", label: "AUTO (All Pairs)" },
  ];
  
  const riskLevels: { value: RiskLevel; maxTrade: string; gasLimit: string }[] = [
    { value: "LOW", maxTrade: "$1,000", gasLimit: "0.003 APT" },
    { value: "MEDIUM", maxTrade: "$2,500", gasLimit: "0.005 APT" },
    { value: "HIGH", maxTrade: "$5,000", gasLimit: "0.01 APT" },
    { value: "VERY_HIGH", maxTrade: "$10,000", gasLimit: "0.05 APT" },
  ];
  
  const selectedRisk = riskLevels.find(r => r.value === riskLevel);

  // Convert logs to Terminal format
  const terminalLogs = logs.map(log => ({
    time: log.time,
    type: log.type as "INFO" | "SCAN" | "EXECUTE" | "WARNING" | "ERROR" | "SUCCESS",
    message: log.message,
    detail: log.detail,
  }));

  // Fetch vault balances
  const fetchVaultBalances = useCallback(async () => {
    if (!connected || !account?.address) {
      setVaultBalances([
        { token: "ALGO", amount: "0.0000", usdValue: "0.00", walletAmount: "0.0000", walletUsdValue: "0.00" },
        { token: "USDC", amount: "0.00", usdValue: "0.00", walletAmount: "0.00", walletUsdValue: "0.00" },
        { token: "USDT", amount: "0.00", usdValue: "0.00", walletAmount: "0.00", walletUsdValue: "0.00" },
      ]);
      setTotalUsdValue("0.00");
      return;
    }

    setIsLoadingVault(true);
    try {
      // Fetch vault balances from backend
      const vaultResponse = await apiService.getUserVault(account.address);
      
      // Fetch wallet balances from Algorand
      const walletResponse = await fetch(`http://localhost:3001/api/balance/${account.address}`);
      const walletData = await walletResponse.json();
      
      if (vaultResponse.success && vaultResponse.data) {
        let total = 0;
        const balances: VaultTokenBalance[] = [];
        const agentBalances = { ALGO: 0, USDC: 0, USDT: 0 };
        
        // Process each token
        ['ALGO', 'USDC', 'USDT'].forEach(symbol => {
          const vaultBalance = vaultResponse.data!.balances.find(
            b => b.coinSymbol.toUpperCase() === symbol
          );
          
          const decimals = 6;
          const rawVaultBalance = vaultBalance ? parseFloat(vaultBalance.balance) : 0;
          const formattedVaultBalance = rawVaultBalance / Math.pow(10, decimals);
          
          // Get wallet balance
          const walletBalance = walletData.success && walletData.balances 
            ? parseFloat(walletData.balances[symbol] || '0') 
            : 0;
          
          // Calculate USD values using live prices
          const price = prices[symbol as keyof typeof prices] || 0;
          const vaultUsdValue = formattedVaultBalance * price;
          const walletUsdValue = walletBalance * price;
          total += vaultUsdValue + walletUsdValue;
          
          balances.push({
            token: symbol as 'ALGO' | 'USDC' | 'USDT',
            amount: formattedVaultBalance.toFixed(symbol === 'ALGO' ? 4 : 2),
            usdValue: vaultUsdValue.toFixed(2),
            walletAmount: walletBalance.toFixed(symbol === 'ALGO' ? 4 : 2),
            walletUsdValue: walletUsdValue.toFixed(2)
          });
          
          agentBalances[symbol as keyof typeof agentBalances] = formattedVaultBalance;
        });
        
        setVaultBalances(balances);
        setTotalUsdValue(total.toFixed(2));
        
        // Update agent with vault balances
        updateAgentVaultBalances({ ...agentBalances, APT: 0 });
      }
    } catch (err) {
      console.error('Failed to fetch vault balances:', err);
    } finally {
      setIsLoadingVault(false);
    }
  }, [connected, account?.address, prices, updateAgentVaultBalances]);

  // Fetch balances on mount and when prices change
  useEffect(() => {
    fetchVaultBalances();
  }, [fetchVaultBalances]);

  // Update agent with live prices
  useEffect(() => {
    updatePrices(prices as unknown as Record<string, number>);
  }, [prices, updatePrices]);

  // Set wallet address for MongoDB updates
  useEffect(() => {
    if (account?.address) {
      setWalletAddress(account.address);
    }
  }, [account?.address, setWalletAddress]);

  // Update agent config when settings change
  useEffect(() => {
    updateConfig({
      minProfitThreshold: minProfit[0],
      riskTolerance: riskLevel,
      selectedPair: selectedPair,
      investedAmount: useFixedAmount ? investedAmount[0] : undefined,
    });
  }, [minProfit, riskLevel, selectedPair, investedAmount, useFixedAmount, updateConfig]);

  // Handle start/stop
  const handleStartAgent = () => {
    startAgent();
  };

  const handleStopAgent = () => {
    stopAgent();
  };

  return (
    <div className="min-h-screen bg-background dark text-foreground relative overflow-hidden selection:bg-primary/30">
      <GlobalBackground />
      <Navbar />
      
      <main className="pt-32 pb-16 relative z-10">
        <div className="container mx-auto px-6 lg:px-12 max-w-7xl">
          {/* Back Link */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4 }}
          >
            <Link 
              to="/dashboard" 
              className="inline-flex items-center gap-2 text-primary hover:text-primary/80 transition-colors mb-8 group"
            >
              <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
              BACK TO COMMAND CENTER
            </Link>
            <h1 className="font-hero text-4xl lg:text-6xl font-bold tracking-tight text-white mb-4 uppercase">
              Agent <span className="text-primary glow-text">Fleet</span>
            </h1>
            <p className="text-muted-foreground text-lg max-w-2xl mb-12">Deploy and manage your autonomous arbitrage intelligence force.</p>
          </motion.div>

          {/* Active Agents Status - New Section */}
          

          {/* Vault Balances - Top Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-12"
          >
            <div className="rounded-3xl border border-primary bg-black/40 backdrop-blur-xl p-8 shadow-[0_0_20px_rgba(255,138,0,0.15)] relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-[80px] -mr-32 -mt-32" />
              
              <div className="flex items-center justify-between mb-8 relative z-10">
                <h2 className="font-hero text-2xl font-bold tracking-tight text-white flex items-center gap-3">
                  <Wallet className="h-6 w-6 text-primary" />
                  FLEET CAPITAL
                </h2>
                <div className="flex items-center gap-6">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={fetchVaultBalances}
                    disabled={isLoadingVault}
                    className="text-primary hover:text-primary hover:bg-white/5"
                  >
                    <RefreshCw className={`h-4 w-4 mr-2 ${isLoadingVault ? 'animate-spin' : ''}`} />
                    SYNC
                  </Button>
                  <div className="text-right">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Total Operations Value</p>
                    <p className="font-hero font-bold text-3xl text-primary glow-text">${totalUsdValue}</p>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
                {vaultBalances.map((balance) => (
                  <div 
                    key={balance.token} 
                    className="p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-primary/50 transition-all duration-500 hover:shadow-[0_0_15px_rgba(255,138,0,0.1)] group"
                  >
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-3">
                        <CryptoLogo symbol={balance.token} size="sm" />
                        <span className="font-hero text-lg font-bold text-white tracking-tight">{balance.token}</span>
                      </div>
                      <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold bg-white/5 px-2 py-1 rounded border border-white/5">Vault Asset</span>
                    </div>
                    
                    <div className="mb-4">
                      <p className="text-3xl font-bold text-white group-hover:text-primary transition-colors">{balance.amount}</p>
                      <p className="text-sm text-muted-foreground font-medium">${balance.usdValue}</p>
                    </div>
                    
                    <div className="pt-4 border-t border-white/5 flex justify-between items-baseline">
                      <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Liquid Wallet</span>
                      <span className="text-sm font-bold text-white opacity-60">{balance.walletAmount || '0.00'}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left: Agent Configuration */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="lg:col-span-1 space-y-6"
            >
              {/* Config Panel */}
              <div className="rounded-3xl border border-primary bg-black/40 backdrop-blur-xl p-8 shadow-[0_0_20px_rgba(255,138,0,0.15)] sticky top-32">
                <h2 className="font-hero text-2xl font-bold tracking-tight text-white mb-8 flex items-center gap-3">
                  <Settings className="h-6 w-6 text-primary" />
                  CONFIGURATION
                </h2>
                
                {/* Min Profitability */}
                <div className="mb-6">
                  <label className="text-sm text-muted-foreground mb-3 block font-display">
                    Minimum Profit Threshold
                  </label>
                  <Slider
                    value={minProfit}
                    onValueChange={setMinProfit}
                    min={0.0001}
                    max={1}
                    step={0.0001}
                    className="mb-2"
                    disabled={isRunning}
                  />
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Min: 0.0001%</span>
                    <span className="font-mono font-semibold text-primary">{minProfit[0].toFixed(4)}%</span>
                    <span className="text-muted-foreground">Max: 1.0%</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Only execute trades with profit ≥ {minProfit[0].toFixed(4)}%
                  </p>
                </div>

                {/* Investment Mode Selection */}
                <div className="mb-6">
                  <label className="text-sm text-muted-foreground mb-3 block font-display">
                    Investment Mode
                  </label>
                  <div className="space-y-3">
                    <label className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all border ${
                      !useFixedAmount
                        ? "bg-primary/10 border-primary/30"
                        : "bg-muted/50 border-transparent hover:bg-muted"
                    } ${isRunning ? 'opacity-50 cursor-not-allowed' : ''}`}>
                      <input
                        type="radio"
                        name="investmentMode"
                        checked={!useFixedAmount}
                        onChange={() => !isRunning && setUseFixedAmount(false)}
                        disabled={isRunning}
                        className="sr-only"
                      />
                      <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                        !useFixedAmount ? "border-primary" : "border-muted-foreground"
                      }`}>
                        {!useFixedAmount && (
                          <div className="w-2 h-2 rounded-full bg-primary" />
                        )}
                      </div>
                      <div>
                        <span className={`font-mono text-sm ${
                          !useFixedAmount ? "text-foreground" : "text-muted-foreground"
                        }`}>
                          Automatic Allocation
                        </span>
                        <p className="text-xs text-muted-foreground">
                          Dynamic investment
                        </p>
                      </div>
                    </label>
                    
                    <label className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all border ${
                      useFixedAmount
                        ? "bg-primary/10 border-primary/30"
                        : "bg-muted/50 border-transparent hover:bg-muted"
                    } ${isRunning ? 'opacity-50 cursor-not-allowed' : ''}`}>
                      <input
                        type="radio"
                        name="investmentMode"
                        checked={useFixedAmount}
                        onChange={() => !isRunning && setUseFixedAmount(true)}
                        disabled={isRunning}
                        className="sr-only"
                      />
                      <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                        useFixedAmount ? "border-primary" : "border-muted-foreground"
                      }`}>
                        {useFixedAmount && (
                          <div className="w-2 h-2 rounded-full bg-primary" />
                        )}
                      </div>
                      <div>
                        <span className={`font-mono text-sm ${
                          useFixedAmount ? "text-foreground" : "text-muted-foreground"
                        }`}>
                          Fixed Amount
                        </span>
                        <p className="text-xs text-muted-foreground">
                          Fixed amount investment
                        </p>
                      </div>
                    </label>
                  </div>
                </div>

                {/* Invested Amount - Only show when Fixed Amount is selected */}
                {useFixedAmount && (
                  <div className="mb-6">
                    <label className="text-sm text-muted-foreground mb-3 block font-display">
                      Fixed Amount per Trade
                    </label>
                    <Slider
                      value={investedAmount}
                      onValueChange={setInvestedAmount}
                      min={10}
                      max={10000}
                      step={1}
                      className="mb-2"
                      disabled={isRunning}
                    />
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Min: $10</span>
                      <span className="font-mono font-semibold text-primary">${investedAmount[0].toFixed(0)}</span>
                      <span className="text-muted-foreground">Max: $10,000</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      Fixed amount to invest per trade. Agent will check all pairs continuously until manually stopped.
                    </p>
                  </div>
                )}
                
                {/* Trading Pairs */}
                <div className="mb-6">
                  <label className="text-sm text-muted-foreground mb-3 block font-display">
                    Trading Pairs
                  </label>
                  <div className="space-y-2">
                    {pairs.map((pair) => (
                      <label
                        key={pair.value}
                        className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all border ${
                          selectedPair === pair.value
                            ? "bg-primary/10 border-primary/30"
                            : "bg-muted/50 border-transparent hover:bg-muted"
                        } ${isRunning ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        <input
                          type="radio"
                          name="pair"
                          value={pair.value}
                          checked={selectedPair === pair.value}
                          onChange={(e) => !isRunning && setSelectedPair(e.target.value)}
                          disabled={isRunning}
                          className="sr-only"
                        />
                        <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                          selectedPair === pair.value ? "border-primary" : "border-muted-foreground"
                        }`}>
                          {selectedPair === pair.value && (
                            <div className="w-2 h-2 rounded-full bg-primary" />
                          )}
                        </div>
                        <span className={`font-mono text-sm ${
                          selectedPair === pair.value ? "text-foreground" : "text-muted-foreground"
                        }`}>
                          {pair.label}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
                
                {/* Risk Level */}
                <div className="mb-6">
                  <label className="text-sm text-muted-foreground mb-3 block font-display">
                    Risk Tolerance
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {(["LOW", "MEDIUM", "HIGH", "VERY_HIGH"] as RiskLevel[]).map((level) => (
                      <button
                        key={level}
                        onClick={() => !isRunning && setRiskLevel(level)}
                        disabled={isRunning}
                        className={`py-2 px-1 rounded-lg font-display text-sm font-bold transition-all ${
                          riskLevel === level
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-muted-foreground hover:bg-muted/80"
                        } ${isRunning ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        {level.split("_").join(" ")}
                      </button>
                    ))}
                  </div>
                  {selectedRisk && (
                    <div className="mt-3 p-3 rounded-lg bg-muted/50 border border-border text-sm">
                      <div className="grid grid-cols-2 gap-2">
                        <span className="text-muted-foreground">Max trade:</span>
                        <span className="font-mono text-foreground">{selectedRisk.maxTrade}</span>
                        <span className="text-muted-foreground">Gas limit:</span>
                        <span className="font-mono text-foreground">{selectedRisk.gasLimit}</span>
                        {useFixedAmount && (
                          <>
                            <span className="text-muted-foreground">Your amount:</span>
                            <span className="font-mono text-primary">${investedAmount[0].toFixed(0)}</span>
                          </>
                        )}
                      </div>
                      {useFixedAmount && investedAmount[0] > parseInt(selectedRisk.maxTrade.replace(/[$,]/g, '')) && (
                        <p className="text-xs text-warning mt-2">
                          ⚠️ Your invested amount exceeds the risk limit. It will be capped at {selectedRisk.maxTrade}.
                        </p>
                      )}
                      {!useFixedAmount && (
                        <p className="text-xs text-muted-foreground mt-2">
                          💡 Automatic mode will use percentage-based allocation from your vault balance.
                        </p>
                      )}
                    </div>
                  )}
                </div>
                
                {/* Action Buttons */}
                <div className="space-y-4 pt-4">
                  {!isRunning ? (
                    <Button 
                      variant="hero" 
                      size="lg" 
                      className="w-full font-hero text-lg tracking-wider font-bold py-8 rounded-2xl shadow-[0_0_20px_rgba(255,138,0,0.3)]"
                      onClick={handleStartAgent}
                    >
                      <Play className="h-6 w-6 mr-2 fill-current" />
                      DEPLOY AGENT
                    </Button>
                  ) : (
                    <Button 
                      variant="outline" 
                      size="lg" 
                      className="w-full font-hero text-lg tracking-wider font-bold py-8 rounded-2xl border-destructive/50 text-destructive hover:bg-destructive/10 transition-all"
                      onClick={handleStopAgent}
                    >
                      <Square className="h-6 w-6 mr-2 fill-current" />
                      SECURE TERMINATION
                    </Button>
                  )}
                  
                  {isRunning && (
                    <div className="p-6 rounded-2xl bg-success/10 border border-success/30 relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-16 h-16 bg-success/10 rounded-full blur-xl -mr-8 -mt-8" />
                      
                      <div className="flex items-center justify-center gap-3 text-success mb-6 relative z-10">
                        <div className="w-2.5 h-2.5 rounded-full bg-success animate-pulse" />
                        <span className="font-hero tracking-widest font-bold text-sm">OPERATIONAL</span>
                      </div>
                      
                      {/* Profit Display */}
                      <div className="p-4 rounded-xl bg-black/40 border border-success/30 mb-6 relative z-10">
                        <div className="text-center">
                          <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold mb-1">UNREALIZED SESSION PROFIT</p>
                          <p className="font-mono text-3xl font-bold text-success glow-text">
                            +${agentState.totalProfit.toFixed(4)}
                          </p>
                        </div>
                      </div>
                      
                      {/* Agent Stats Grid */}
                      <div className="grid grid-cols-2 gap-3 text-xs relative z-10">
                        <div className="p-3 rounded-xl bg-white/5 border border-white/5">
                          <p className="text-muted-foreground mb-1 font-bold">TRADES</p>
                          <p className="font-mono font-bold text-white text-lg">{agentState.tradesExecuted}</p>
                        </div>
                        <div className="p-3 rounded-xl bg-white/5 border border-white/5">
                          <p className="text-muted-foreground mb-1 font-bold">GAS EST.</p>
                          <p className="font-mono font-bold text-warning text-lg">${agentState.totalGasFees.toFixed(3)}</p>
                        </div>
                      </div>
                      
                      <p className="text-center text-[10px] text-muted-foreground mt-6 font-mono opacity-60">ACTIVE SINCE: {runningDuration}</p>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
            
            {/* Right: Chart & Logs */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="lg:col-span-2 space-y-6"
            >
              {/* Price Chart */}
              <PriceChart />
              
              {/* Live Agent Logs - Terminal Style */}
              <div className="rounded-3xl border border-primary bg-black/40 backdrop-blur-xl p-8 shadow-[0_0_20px_rgba(255,138,0,0.15)]">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="font-hero text-xl font-bold tracking-tight text-white flex items-center gap-3">
                    <Activity className="h-5 w-5 text-primary" />
                    NEURAL TELEMETRY
                  </h3>
                  <div className="flex gap-4">
                    <Button variant="ghost" size="sm" className="text-[10px] font-bold tracking-widest text-muted-foreground hover:text-primary uppercase" onClick={clearLogs}>
                      PURGE BUFFER
                    </Button>
                  </div>
                </div>
                
                {isRunning || logs.length > 0 ? (
                  <Terminal 
                    logs={terminalLogs}
                    title="arbigent@aptos:  ~/logs"
                    maxHeight="400px"
                  />
                ) : (
                  <div className="terminal rounded-lg overflow-hidden">
                    <div className="terminal-header flex items-center gap-2 px-4 py-3 bg-[hsl(220,13%,14%)] border-b border-[hsl(220,9%,22%)]">
                      <div className="flex gap-2">
                        <div className="terminal-dot-red" />
                        <div className="terminal-dot-yellow" />
                        <div className="terminal-dot-green" />
                      </div>
                      <span className="ml-4 text-sm text-gray-400 font-mono">arbigent@aptos</span>
                    </div>
                    <div className="terminal-body bg-[hsl(220,13%,10%)] p-8 text-center">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[hsl(220,13%,18%)] mx-auto mb-3">
                        <Shield className="h-6 w-6 text-gray-500" />
                      </div>
                      <p className="text-gray-400">Agent is not running</p>
                      <p className="text-xs text-gray-600 mt-1">Start an agent to see live logs</p>
                      <div className="mt-4 flex items-center justify-center">
                        <span className="text-primary">→</span>
                        <span className="text-gray-400 ml-2">~</span>
                        <span className="ml-2 text-gray-600">awaiting command...</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Agents;
