import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { 
  ArrowLeft, Play, Square, Settings, Wallet, 
  Activity, Shield, RefreshCw
} from "lucide-react";
import Header from "@/components/Header";
import PriceChart from "@/components/PriceChart";
import Terminal from "@/components/Terminal";
import CryptoLogo from "@/components/CryptoLogo";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { useAlgorandWallet as useWallet } from '@/contexts/AlgorandWalletContext';
import { apiService } from "@/services/ApiService";
import { useLivePrices } from "@/hooks/useLivePrices";
import { useArbiGent } from "@/hooks/useArbiGent";
import { RiskLevel } from "@/services/ArbiGentService";

interface VaultTokenBalance {
  token: 'ALGO' | 'USDC' | 'USDT' | 'ALGO';
  amount: string;
  usdValue: string;
  walletAmount?: string; // NEW: Wallet balance
  walletUsdValue?: string; // NEW: Wallet balance in USD
}

// Low-brightness animated background component (matches Vault.tsx style)
const AnimatedBackground = () => (
  <div className="fixed inset-0 pointer-events-none">
    <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/[0.07] rounded-full blur-3xl animate-pulse" />
    <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-orange-500/[0.07] rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1s" }} />
    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-r from-primary/[0.03] to-orange-500/[0.03] rounded-full blur-3xl" />
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
  
  const { account, connected } = useWallet();
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
    { value: "USDC_ALGO", label: "USDC → ALGO" },
    { value: "ALGO_USDT", label: "ALGO → USDT" },
    { value: "USDC_USDT", label: "USDC → USDT" },
    { value: "AUTO", label: "AUTO (All Pairs)" },
  ];
  
  const riskLevels: { value: RiskLevel; maxTrade: string; gasLimit: string }[] = [
    { value: "LOW", maxTrade: "$1,000", gasLimit: "0.001 ALGO" },
    { value: "MEDIUM", maxTrade: "$2,500", gasLimit: "0.002 ALGO" },
    { value: "HIGH", maxTrade: "$5,000", gasLimit: "0.004 ALGO" },
    { value: "VERY_HIGH", maxTrade: "$10,000", gasLimit: "0.01 ALGO" },
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
        updateAgentVaultBalances(agentBalances);
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
    <div className="min-h-screen bg-background dark relative overflow-hidden">
      <Header />
      
      <main className="pt-24 pb-16 relative z-10">
        <div className="container mx-auto px-4 lg:px-8">
          {/* Back Link */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4 }}
          >
            <Link 
              to="/dashboard" 
              className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors mb-8"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </Link>
          </motion.div>

          {/* Active Agents Status - New Section */}
          

          {/* Vault Balances - Top Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-6"
          >
            <div className="rounded-xl border border-border bg-card p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-display text-xl font-bold tracking-wide text-foreground flex items-center gap-2">
                  <Wallet className="h-5 w-5 text-primary" />
                  VAULT BALANCES
                </h2>
                <div className="flex items-center gap-3">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={fetchVaultBalances}
                    disabled={isLoadingVault}
                    className="h-8 px-3"
                  >
                    <RefreshCw className={`h-4 w-4 ${isLoadingVault ? 'animate-spin' : ''}`} />
                  </Button>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">Total Value</p>
                    <p className="font-mono font-bold text-lg text-primary">${totalUsdValue}</p>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                {vaultBalances.map((balance) => (
                  <div 
                    key={balance.token} 
                    className="p-4 rounded-lg bg-muted/50 border border-border hover:border-primary/50 transition-colors"
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <CryptoLogo symbol={balance.token} size="sm" />
                      <div className="flex flex-col">
                        <span className="font-mono text-sm font-semibold text-foreground">{balance.token}</span>
                        <span className="font-mono text-xs text-muted-foreground">Vault</span>
                      </div>
                    </div>
                    
                    {/* Vault Balance */}
                    <div className="mb-3 pb-3 border-b border-border/50">
                      <p className="font-mono text-xl font-bold text-foreground">{balance.amount}</p>
                      <p className="text-xs text-muted-foreground">${balance.usdValue}</p>
                    </div>
                    
                    {/* Wallet Balance */}
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Wallet: {balance.walletAmount || '0.00'}</p>
                      <p className="text-xs text-muted-foreground">${balance.walletUsdValue || '0.00'}</p>
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
              <div className="rounded-xl border border-border bg-card p-6 sticky top-24">
                <h2 className="font-display text-xl font-bold tracking-wide text-foreground mb-6 flex items-center gap-2">
                  <Settings className="h-5 w-5 text-primary" />
                  AGENT CONFIGURATION
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
                <div className="space-y-3">
                  {!isRunning ? (
                    <Button 
                      variant="glow" 
                      size="lg" 
                      className="w-full font-display tracking-wide font-bold"
                      onClick={handleStartAgent}
                    >
                      <Play className="h-5 w-5" />
                      START AGENT
                    </Button>
                  ) : (
                    <Button 
                      variant="outline" 
                      size="lg" 
                      className="w-full font-display tracking-wide font-bold border-destructive/50 text-destructive hover:bg-destructive/10"
                      onClick={handleStopAgent}
                    >
                      <Square className="h-5 w-5" />
                      STOP AGENT
                    </Button>
                  )}
                  
                  {isRunning && (
                    <div className="p-3 rounded-lg bg-success/10 border border-success/30">
                      <div className="flex items-center justify-center gap-2 text-success mb-2">
                        <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
                        <span className="font-display tracking-wide font-bold">AGENT ACTIVE</span>
                      </div>
                      <p className="text-xs text-muted-foreground text-center mb-3">Running for: {runningDuration}</p>
                      
                      {/* Profit Display */}
                      <div className="p-2 rounded bg-success/20 border border-success/30 mb-3">
                        <div className="text-center">
                          <p className="text-xs text-muted-foreground">Total Profit</p>
                          <p className="font-mono text-xl font-bold text-success">
                            +${agentState.totalProfit.toFixed(4)}
                          </p>
                        </div>
                      </div>
                      
                      {/* Agent Stats Grid */}
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="p-2 rounded bg-muted/50">
                          <p className="text-muted-foreground">Trades</p>
                          <p className="font-mono font-bold text-foreground">{agentState.tradesExecuted}</p>
                        </div>
                        <div className="p-2 rounded bg-muted/50">
                          <p className="text-muted-foreground">Skipped</p>
                          <p className="font-mono font-bold text-foreground">{agentState.tradesSkipped}</p>
                        </div>
                        <div className="p-2 rounded bg-muted/50">
                          <p className="text-muted-foreground">Gas Fees</p>
                          <p className="font-mono font-bold text-warning">${agentState.totalGasFees.toFixed(4)}</p>
                        </div>
                        <div className="p-2 rounded bg-muted/50">
                          <p className="text-muted-foreground">Slippage</p>
                          <p className="font-mono font-bold text-warning">${agentState.totalSlippage.toFixed(4)}</p>
                        </div>
                      </div>
                      
                      {/* Total Costs */}
                      <div className="mt-2 p-2 rounded bg-muted/50 text-xs">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Total Costs:</span>
                          <span className="font-mono font-bold text-destructive">${agentState.totalCosts.toFixed(4)}</span>
                        </div>
                      </div>
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
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-display tracking-wide font-bold text-foreground flex items-center gap-2">
                    <Activity className="h-4 w-4 text-primary" />
                    LIVE AGENT LOGS
                  </h3>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm" className="text-xs" onClick={clearLogs}>
                      Clear
                    </Button>
                    {/* <Button variant="ghost" size="sm" className="text-xs">Export</Button> */}
                  </div>
                </div>
                
                {isRunning || logs.length > 0 ? (
                  <Terminal 
                    logs={terminalLogs}
                    title="arbigent@algorand:~/logs"
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
                      <span className="ml-4 text-sm text-gray-400 font-mono">arbigent@algorand</span>
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
