import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { useState, useCallback, useEffect, useRef } from "react";
import {
  Wallet, TrendingUp, Bot, ArrowRight,
  Shield, Vault, Activity, ExternalLink, RefreshCw
} from "lucide-react";
import Header from "@/components/Header";
import Navbar from "@/components/Navbar";
import ShapeGrid from "@/components/ShapeGrid";
import StatsCard from "@/components/StatsCard";
import CryptoLogo from "@/components/CryptoLogo";
import DashboardSkeleton from "@/components/DashboardSkeleton";
import UpdateNotification from "@/components/UpdateNotification";
import { Button } from "@/components/ui/button";
import { useAlgorandWallet } from '@/contexts/AlgorandWalletContext';
import { useVault } from "@/hooks/useVault";
import { useMarketData } from "@/hooks/useMarketData";
import { apiService } from "@/services/ApiService";
import useArbiGent from "@/hooks/useArbiGent";

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

const Dashboard = () => {
  const { connected, account } = useAlgorandWallet();
  const { vault, isLoading: vaultLoading } = useVault();
  const { tokenPrices, opportunities, isLoading: marketLoading, refreshOpportunities } = useMarketData();

  // ArbiGent hook for agent status
  const {
    isRunning,
    logs,
    agentState,
    agentConfig,
    runningDuration,
    startAgent,
    stopAgent,
    clearLogs,
    updateConfig,
    updateVaultBalances: updateAgentVaultBalances,
    updatePrices,
    setWalletAddress,
    onStatsUpdate,
  } = useArbiGent();

  // State for arbitrage stats
  const [arbitrageStats, setArbitrageStats] = useState<any>(null);
  const [isLoadingStats, setIsLoadingStats] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [lastStatsUpdate, setLastStatsUpdate] = useState<Date | null>(null);
  const [previousStats, setPreviousStats] = useState<any>(null);
  const [showUpdateNotification, setShowUpdateNotification] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');
  const [notificationType, setNotificationType] = useState<'success' | 'info' | 'profit' | 'loss'>('info');

  // Token balances state
  const [tokenBalances, setTokenBalances] = useState<Array<{
    token: string;
    vaultBalance: string;
    walletBalance: string;
    vaultUsd: string;
    walletUsd: string;
  }>>([]);

  // Use ref to avoid dependency issues
  const arbitrageStatsRef = useRef<any>(null);

  // Fetch arbitrage stats
  const fetchArbitrageStats = useCallback(async (isBackground = false) => {
    if (!connected || !account?.address) {
      console.log('Not fetching stats - not connected or no address');
      setArbitrageStats(null);
      setIsInitialLoad(false);
      return;
    }


    // Only show loading spinner for manual refreshes, not background updates
    if (!isBackground) {
      setIsLoadingStats(true);
    }

    try {
      const response = await apiService.getArbitrageStats(account.address);

      if (response.success) {

        // Store previous stats for smooth transitions
        const currentStats = arbitrageStatsRef.current;
        if (currentStats) {
          setPreviousStats(currentStats);

          // Show notification for significant changes
          const profitChange = response.data.arbitrageStats.totalProfitLoss - currentStats.totalProfitLoss;
          if (Math.abs(profitChange) > 0.01) {
            setNotificationMessage(`Arbitrage updated: ${profitChange >= 0 ? '+' : ''}$${profitChange.toFixed(2)}`);
            setNotificationType(profitChange >= 0 ? 'profit' : 'loss');
            setShowUpdateNotification(true);
          }
        }

        setArbitrageStats(response.data.arbitrageStats);
        arbitrageStatsRef.current = response.data.arbitrageStats;
        setLastStatsUpdate(new Date());
        setIsInitialLoad(false);
      } else {
        console.warn('❌ Failed to fetch arbitrage stats:', response.error);
        if (isInitialLoad) {
          setArbitrageStats(null);
        }
        setIsInitialLoad(false);
      }
    } catch (error) {
      console.error('💥 Error fetching arbitrage stats:', error);
      if (isInitialLoad) {
        setArbitrageStats(null);
      }
      setIsInitialLoad(false);
    } finally {
      if (!isBackground) {
        setIsLoadingStats(false);
      }
    }
  }, [connected, account?.address]);

  // Fetch arbitrage stats on mount and when wallet changes
  useEffect(() => {
    fetchArbitrageStats();
  }, [fetchArbitrageStats]);

  // Fetch token balances
  const fetchTokenBalances = useCallback(async () => {
    if (!connected || !account?.address || !vault) return;

    try {
      // Fetch wallet balances from backend
      const walletResponse = await fetch(`http://localhost:3001/api/balance/${account.address}`);
      const walletData = await walletResponse.json();

      const balances = ['ALGO', 'USDC', 'USDT'].map(symbol => {
        // Get vault balance
        const vaultBalance = vault.balances.find(b => b.coinSymbol.toUpperCase() === symbol);
        const decimals = 6;
        const rawVaultBalance = vaultBalance ? parseFloat(vaultBalance.balance) : 0;
        const formattedVaultBalance = rawVaultBalance / Math.pow(10, decimals);

        // Get wallet balance
        const walletBalance = walletData.success && walletData.balances
          ? parseFloat(walletData.balances[symbol] || '0')
          : 0;

        // Get price
        const price = tokenPrices[symbol]?.price || '$0.00';
        const priceNum = parseFloat(price.replace('$', '').replace(',', '')) || 0;

        return {
          token: symbol,
          vaultBalance: formattedVaultBalance.toFixed(symbol === 'ALGO' ? 4 : 2),
          walletBalance: walletBalance.toFixed(symbol === 'ALGO' ? 4 : 2),
          vaultUsd: (formattedVaultBalance * priceNum).toFixed(2),
          walletUsd: (walletBalance * priceNum).toFixed(2)
        };
      });

      setTokenBalances(balances);
    } catch (error) {
      console.error('Failed to fetch token balances:', error);
    }
  }, [connected, account?.address, vault, tokenPrices]);

  // Fetch token balances when vault or prices change
  useEffect(() => {
    fetchTokenBalances();
  }, [fetchTokenBalances]);

  // Set wallet address when account changes
  useEffect(() => {
    if (account?.address) {
      setWalletAddress(account.address);
    }
  }, [account?.address, setWalletAddress]);

  // Set up stats update callback - only for agent-triggered updates
  useEffect(() => {
    onStatsUpdate(() => {
      console.log('Stats update callback triggered from agent');
      setTimeout(() => {
        fetchArbitrageStats(true); // Background refresh when agent updates stats
      }, 500); // Small delay to ensure backend has processed
    });
  }, [onStatsUpdate, fetchArbitrageStats]);

  // Calculate total vault value in USD
  const calculateTotalVaultValue = () => {
    if (!vault || !tokenPrices) return { total: 0, aptBalance: 0 };

    let total = 0;
    let aptBalance = 0;

    vault.balances.forEach(balance => {
      const symbol = balance.coinSymbol.toUpperCase();
      const price = tokenPrices[symbol];
      if (price) {
        const decimals = symbol === 'APT' ? 8 : 6;
        const balanceNum = (parseFloat(balance.balance) || 0) / Math.pow(10, decimals);
        const priceStr = price.price.replace('$', '').replace(',', '');
        const priceNum = parseFloat(priceStr) || 0;
        const value = balanceNum * priceNum;
        total += value;

        if (symbol === 'APT') {
          aptBalance = balanceNum;
        }
      }
    });

    return { total, aptBalance };
  };

  const vaultStats = calculateTotalVaultValue();
  const aptPrice = tokenPrices.APT?.price || '$0.00';
  const aptChange = tokenPrices.APT?.change || '+0.0%';

  // Transform opportunities for display
  const displayOpportunities = (opportunities || []).slice(0, 5).map(opp => {
    const fromToken = opp.route.from_pair?.split('_')[0]?.toUpperCase() || 'UNKNOWN';
    const toToken = opp.route.to_pair?.split('_')[1]?.toUpperCase() || 'APT';

    return {
      pair: `${fromToken}/${toToken}`,
      route: `${opp.route.from_dex} → ${opp.route.to_dex}`,
      spread: `${(opp.profitability.price_difference_percent || 0).toFixed(2)}%`,
      profit: `$${opp.profitability.net_profit_usd.toFixed(2)}`,
      gas: `${(opp.charges?.gas_fees?.total_gas_cost_apt || 0).toFixed(3)} APT`,
      risk: opp.risk_level.toUpperCase(),
      isExecutable: opp.profitability.is_profitable && opp.profitability.net_profit_usd > 1
    };
  });

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case "LOW": return "bg-success/20 text-success border-success/30";
      case "MEDIUM": case "MED": return "bg-warning/20 text-warning border-warning/30";
      case "HIGH": return "bg-destructive/20 text-destructive border-destructive/30";
      default: return "bg-muted text-muted-foreground";
    }
  };

  if (!connected) {
    return (
      <div className="min-h-screen bg-background dark text-foreground relative overflow-hidden">
        <GlobalBackground />
        <Navbar />
        <main className="pt-32 pb-16 relative z-10 flex flex-col items-center justify-center min-h-[80vh]">
          <div className="container mx-auto px-4 lg:px-8 text-center">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="font-hero text-4xl lg:text-6xl font-bold tracking-tight text-foreground mb-6"
            >
              DASHBOARD
            </motion.h1>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-muted-foreground text-lg mb-8 max-w-xl mx-auto"
            >
              Connectivity required. Please link your secure Algorand wallet to access the ArbiGent autonomous trading command center.
            </motion.p>
            <Button 
              variant="hero" 
              size="lg"
              onClick={() => document.querySelector<HTMLButtonElement>('nav button[variant="hero"]')?.click()}
            >
              Connect Wallet <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </div>
        </main>
      </div>
    );
  }

  // Show skeleton loader during initial load
  if (isInitialLoad && connected) {
    return <DashboardSkeleton />;
  }


  return (
    <div className="min-h-screen bg-background dark text-foreground relative overflow-hidden selection:bg-primary/30">
      <GlobalBackground />
      <Navbar />

      {/* Update Notification */}
      <UpdateNotification
        show={showUpdateNotification}
        message={notificationMessage}
        type={notificationType}
        onHide={() => setShowUpdateNotification(false)}
      />

      <main className="pt-32 pb-16 relative z-10">
        <div className="container mx-auto px-6 lg:px-12 max-w-7xl">
          {/* Page Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-8 flex items-center justify-between"
          >
            <div>
              <h1 className="font-hero text-4xl lg:text-5xl font-bold tracking-tight text-white mb-2">
                DASHBOARD <span className="text-primary glow-text">CENTER</span>
              </h1>
              <p className="text-muted-foreground text-lg">
                Command center for your autonomous arbitrage fleet.
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => fetchArbitrageStats(false)}
              disabled={isLoadingStats}
              className="text-primary mr-2"
            >
              <RefreshCw className={`h-4 w-4 ${isLoadingStats ? 'animate-spin' : ''}`} />
              Refresh Stats
            </Button>

          </motion.div>



          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <StatsCard
              icon={Wallet}
              label="Total Vault Balance"
              value={`$${vaultStats.total.toFixed(2)}`}
              // subValue={`APT: ${vaultStats.aptBalance.toFixed(4)}`}
              delay={0}
              isLoading={vaultLoading}
            />
            {(() => {
              const plValue = isInitialLoad ? 0 : (arbitrageStats?.totalProfitLoss || 0);

              // Temporary simple display for debugging
              if (!isInitialLoad && arbitrageStats?.totalProfitLoss !== undefined) {
              }

              return (
                <StatsCard
                  icon={TrendingUp}
                  label="Total Arbitrage"
                  value={plValue}
                  subValue={`${arbitrageStats?.totalTrades || 0} trades • ${arbitrageStats?.totalSessions || 0} sessions`}
                  trend={{
                    value: arbitrageStats?.totalProfitLoss > 0 ? `+${((arbitrageStats.totalProfitLoss / Math.max(vaultStats.total, 100)) * 100).toFixed(1)}%` : "0.0%",
                    isPositive: (arbitrageStats?.totalProfitLoss || 0) >= 0
                  }}
                  delay={0.1}
                  isLoading={isInitialLoad}
                  isAnimated={true}
                  previousValue={previousStats?.totalProfitLoss}
                  showChangeIndicator={true}
                  isUpdating={isLoadingStats && !isInitialLoad}
                />
              );
            })()}
            <StatsCard
              icon={Bot}
              label="Active Agents"
              value={isRunning ? "1" : "0"}
              subValue={isRunning ? `ArbiGent running • ${runningDuration}` : "No agents running"}
              delay={0.2}
            />
            <StatsCard
              icon={Activity}
              label="APT Price"
              value={aptPrice}
              subValue={`24h: ${aptChange}`}
              delay={0.3}
              isLoading={marketLoading}
            />
          </div>

          {/* Token Balances Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="mb-12"
          >
            <div className="rounded-3xl border border-primary bg-black/40 backdrop-blur-xl p-8 shadow-[0_0_20px_rgba(255,138,0,0.15)]">
              <h2 className="font-hero text-2xl font-bold tracking-tight text-white mb-8 flex items-center gap-3">
                <Wallet className="h-6 w-6 text-primary" />
                VAULT ASSETS
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {tokenBalances.map((balance) => (
                  <div 
                    key={balance.token}
                    className="p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-primary/50 transition-all duration-500 hover:shadow-[0_0_20px_rgba(255,138,0,0.2)] group"
                  >
                    <div className="flex items-center gap-4 mb-6">
                      <CryptoLogo symbol={balance.token} size="md" />
                      <div>
                        <h3 className="font-hero text-xl font-bold text-white tracking-tight">{balance.token}</h3>
                        <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Vault Allocation</p>
                      </div>
                    </div>
                    
                    {/* Vault Balance */}
                    <div className="mb-6 pb-6 border-b border-white/5">
                      <div className="flex items-baseline justify-between mb-2">
                        <span className="font-mono text-3xl font-bold text-primary group-hover:glow-text transition-all">{balance.vaultBalance}</span>
                        <span className="text-xs text-muted-foreground font-mono">EST. VALUE</span>
                      </div>
                      <p className="text-base text-muted-foreground font-medium">${balance.vaultUsd}</p>
                    </div>
                    
                    {/* Wallet Balance */}
                    <div>
                      <p className="text-xs text-muted-foreground mb-3 uppercase tracking-wider font-semibold">Wallet Liquid</p>
                      <div className="flex items-baseline justify-between">
                        <span className="font-mono text-xl font-bold text-white">{balance.walletBalance}</span>
                        <span className="text-xs text-muted-foreground font-medium">${balance.walletUsd}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Quick Actions */}
          {/* <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mb-8"
          >
            <div className="rounded-xl border border-border bg-card p-6">


            
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted mb-4">
                  <Shield className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="font-display text-xl font-bold tracking-wide text-foreground mb-2">NO ACTIVE AGENTS</h3>
                <p className="text-muted-foreground max-w-md mb-6">
                  Deploy your first autonomous trading agent to start capturing arbitrage opportunities across Aptos DEXs.
                </p>
                <Button variant="glow" size="lg" asChild>
                  <Link to="/agents">
                    Launch Your First Agent
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>
          </motion.div> */}

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-12"
          >
            <div className="rounded-3xl border border-primary bg-black/40 backdrop-blur-xl p-8 shadow-[0_0_20px_rgba(255,138,0,0.15)] relative overflow-hidden">
               {/* Decorative background for active agents */}
               <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-[80px] -mr-32 -mt-32" />

              <div className="flex items-center justify-between mb-8 relative z-10">
                <h2 className="font-hero text-2xl font-bold tracking-tight text-white flex items-center gap-3">
                  <Activity className="h-6 w-6 text-primary" />
                  OPERATIONAL FLEET
                </h2>
                <div className="flex items-center gap-2">
                  {isRunning && (
                    <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-success/20 border border-success/30">
                      <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
                      <span className="text-xs font-mono text-success">RUNNING</span>
                    </div>
                  )}
                  {isRunning ? null : (
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-white">
                      <div className="flex gap-3">
                        <Button variant="outline" size="sm" asChild>
                          <Link to="/vault">
                            <Vault className="h-4 w-4 mr-2" />
                            Vault
                          </Link>
                        </Button>
                        <Button variant="default" size="sm" asChild>
                          <Link to="/agents">
                            + Launch New Agent
                          </Link>
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {isRunning ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 relative z-10">
                  {/* Agent Status Card */}
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-3 h-3 rounded-full bg-success animate-pulse" />
                        <span className="font-hero font-bold text-white text-lg">ArbiGent #1</span>
                      </div>
                      <span className="text-xs text-muted-foreground bg-white/5 px-2 py-1 rounded-full border border-white/10">ACTIVE: {runningDuration}</span>
                    </div>

                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between border-b border-white/5 pb-2">
                        <span className="text-muted-foreground uppercase tracking-wider text-[10px] font-bold">Strategy</span>
                        <span className="font-mono text-white">{agentConfig.selectedPair}</span>
                      </div>
                      <div className="flex justify-between border-b border-white/5 pb-2">
                        <span className="text-muted-foreground uppercase tracking-wider text-[10px] font-bold">Risk Level</span>
                        <span className="font-mono text-white">{agentConfig.riskTolerance}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground uppercase tracking-wider text-[10px] font-bold">Threshold</span>
                        <span className="font-mono text-white">{agentConfig.minProfitThreshold.toFixed(4)}%</span>
                      </div>
                    </div>

                    {/* Performance Metrics */}
                    <div className="mt-6 pt-6 border-t border-white/10">
                      <div className="grid grid-cols-3 gap-4 text-center">
                        <div>
                          <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold mb-1">Profit</p>
                          <p className="font-mono font-bold text-success text-base">+${agentState.totalProfit.toFixed(2)}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold mb-1">Trades</p>
                          <p className="font-mono font-bold text-white text-base">{agentState.tradesExecuted}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold mb-1">Success</p>
                          <p className="font-mono font-bold text-primary text-base">
                            {agentState.tradesExecuted > 0
                              ? ((agentState.tradesExecuted / (agentState.tradesExecuted + agentState.tradesSkipped)) * 100).toFixed(0)
                              : 0}%
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Recent Activity */}
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
                    <h3 className="font-hero font-bold text-white mb-4 flex items-center gap-2">
                      <Activity className="h-4 w-4 text-primary" />
                      LIVE FEED
                    </h3>
                    <div className="space-y-3 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                      {logs.slice(-5).reverse().map((log, index) => (
                        <div key={index} className="flex items-start gap-3 text-xs border-b border-white/5 pb-2 last:border-0">
                          <span className="text-muted-foreground font-mono whitespace-nowrap opacity-60">[{log.time}]</span>
                          <span className={`font-bold px-1.5 py-0.5 rounded text-[10px] ${log.type === 'SUCCESS' ? 'bg-success/20 text-success' :
                              log.type === 'ERROR' ? 'bg-destructive/20 text-destructive' :
                                log.type === 'WARNING' ? 'bg-warning/20 text-warning' :
                                  log.type === 'SCAN' ? 'bg-primary/20 text-primary' :
                                    'bg-white/5 text-muted-foreground'
                            }`}>
                            {log.type}
                          </span>
                          <span className="text-white/80 font-medium leading-relaxed">{log.message}</span>
                        </div>
                      ))}
                      {logs.length === 0 && (
                        <div className="flex flex-col items-center justify-center py-8 opacity-40">
                          <Activity className="h-8 w-8 mb-2 animate-pulse" />
                          <p className="text-xs">Awaiting live data...</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 relative z-10">
                  <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white/5 border border-white/10 mx-auto mb-6 shadow-xl relative group">
                    <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl group-hover:bg-primary/40 transition-all" />
                    <Shield className="h-10 w-10 text-muted-foreground relative z-10" />
                  </div>
                  <p className="text-white text-xl font-hero font-bold mb-2">NO ACTIVE AGENTS</p>
                  <p className="text-muted-foreground text-sm max-w-xs mx-auto mb-8 leading-relaxed">The fleet is currently docked. Deploy your first autonomous trading agent to start capturing arbitrage opportunities across the network.</p>
                  <Button variant="hero" size="lg" asChild className="shadow-[0_0_20px_rgba(255,138,0,0.3)]">
                    <Link to="/agents">
                      Initialize ArbiGent Agent 
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              )}
            </div>
          </motion.div>


          {/* Opportunities Table */}
          
        </div>
      </main>
    </div>
  );
};

export default Dashboard;