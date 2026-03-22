import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowLeft, Download, Upload, Wallet, CheckCircle, AlertCircle, RefreshCw, Sparkles, ShieldCheck, ExternalLink, Clock } from "lucide-react";
import Navbar from "@/components/Navbar";
import ShapeGrid from "@/components/ShapeGrid";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAlgorandWallet } from '@/contexts/AlgorandWalletContext';
import { useVault } from '@/hooks/useVault';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import CryptoLogo from "@/components/CryptoLogo";
import { API_CONFIG } from '@/config/walletConfig';

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

interface Transaction {
  _id: string;
  transactionHash: string;
  type: string;
  status: string;
  coinSymbol: string;
  amountFormatted: number;
  timestamp: string;
  createdAt?: string;
}

const Vault = () => {
  const { account, connected, balances, smartContract } = useAlgorandWallet();
  const { vault, isLoading: vaultLoading, refreshVault, getFormattedBalance } = useVault();
  const [selectedToken, setSelectedToken] = useState<"ALGO" | "USDC" | "USDT">("ALGO");
  const [depositAmount, setDepositAmount] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [showOptInSection, setShowOptInSection] = useState(true);
  const [optInSuccess, setOptInSuccess] = useState<string | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loadingTransactions, setLoadingTransactions] = useState(false);

  // Fetch transaction history
  const fetchTransactions = async () => {
    if (!account?.address) return;
    
    setLoadingTransactions(true);
    try {
      const response = await fetch(`${API_CONFIG.backendUrl}/transactions/${account.address}?limit=10`);
      if (response.ok) {
        const data = await response.json();
        setTransactions(data.transactions || []);
      }
    } catch (error) {
      console.error('Failed to fetch transactions:', error);
    } finally {
      setLoadingTransactions(false);
    }
  };

  // Refresh vault on mount and after transactions
  useEffect(() => {
    if (connected && account?.address) {
      refreshVault();
      fetchTransactions();
    }
  }, [connected, account?.address, refreshVault]);

  const handleDeposit = async () => {
    if (!depositAmount || smartContract.isProcessing) return;
    
    try {
      let success = false;
      if (selectedToken === 'ALGO') {
        success = await smartContract.depositALGOtoVault(depositAmount);
      } else {
        success = await smartContract.depositTokenToVault(depositAmount, selectedToken);
      }
      
      if (success) {
        setDepositAmount("");
        // Refresh vault balance and transactions after deposit
        setTimeout(() => {
          refreshVault();
          fetchTransactions();
        }, 2000);
      }
    } catch (err) {
      console.error('Deposit error:', err);
    }
  };

  const handleWithdraw = async () => {
    if (!withdrawAmount || smartContract.isProcessing) return;
    
    try {
      const success = await smartContract.withdrawFromVault(withdrawAmount, selectedToken);
      if (success) {
        setWithdrawAmount("");
        // Refresh vault balance and transactions after withdraw
        setTimeout(() => {
          refreshVault();
          fetchTransactions();
        }, 2000);
      }
    } catch (err) {
      console.error('Withdraw error:', err);
    }
  };

  const handleOptIn = async (type: 'USDC' | 'USDT' | 'VAULT') => {
    setOptInSuccess(null);
    smartContract.clearError();
    let success = false;
    
    if (type === 'VAULT') {
      success = await smartContract.optInToApp();
      if (success) {
        setOptInSuccess('Successfully opted into Vault!');
      }
    } else {
      const assetId = type === 'USDC' ? USDC_ASSET_ID : USDT_ASSET_ID;
      success = await smartContract.optInToAsset(assetId, type);
      if (success) {
        setOptInSuccess(`Successfully opted into ${type}!`);
      }
    }
    
    if (success) {
      setTimeout(() => setOptInSuccess(null), 3000);
    }
  };

  const handleSetMax = (isDeposit: boolean) => {
    if (isDeposit) {
      setDepositAmount(getFormattedBalance(selectedToken, true).split(' ')[0]);
    } else {
      setWithdrawAmount(getFormattedBalance(selectedToken).split(' ')[0]);
    }
  };

  const setPercentage = (percentage: number, isDeposit: boolean) => {
    const balanceStr = isDeposit ? getFormattedBalance(selectedToken, true) : getFormattedBalance(selectedToken);
    const balance = parseFloat(balanceStr.split(' ')[0]) || 0;
    const amount = (balance * percentage / 100).toFixed(6);
    if (isDeposit) {
      setDepositAmount(amount);
    } else {
      setWithdrawAmount(amount);
    }
  };

  if (!connected) {
    return (
      <div className="min-h-screen bg-background text-foreground dark relative overflow-hidden flex flex-col items-center justify-center p-6">
        <GlobalBackground />
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative z-10 text-center max-w-md p-8 rounded-3xl border border-white/10 bg-black/40 backdrop-blur-xl shadow-2xl"
        >
          <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
            <Wallet className="w-10 h-10 text-primary" />
          </div>
          <h1 className="font-hero text-3xl font-bold tracking-tight text-white mb-4 uppercase">Vault Access Locked</h1>
          <p className="text-muted-foreground mb-8 text-lg">
            Connect your Algorand wallet to access the secure arbitrage vault and manage your trading capital.
          </p>
          <Button variant="glow" size="lg" asChild className="w-full py-6 text-lg font-bold">
            <Link to="/">Return Home</Link>
          </Button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground dark relative flex flex-col">
      <GlobalBackground />
      <Navbar />
      
      <main className="flex-grow pt-32 pb-20 px-4 md:px-8 relative z-10">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column: Balances & Actions */}
          <div className="lg:col-span-2 space-y-8">
            <header className="mb-8">
              <Link to="/dashboard" className="inline-flex items-center gap-2 text-primary hover:text-primary/80 mb-4 transition-colors font-bold tracking-wider uppercase text-xs">
                <ArrowLeft className="w-3.5 h-3.5" />
                Back to Dashboard
              </Link>
              <h1 className="font-hero text-4xl md:text-5xl font-bold tracking-tight text-white">
                ARBITRAGE <span className="text-primary">VAULT</span>
              </h1>
              <p className="text-muted-foreground text-lg max-w-xl">
                Manage your trading capital. Assets in the vault are used by the ArbiGent engine to execute arbitrage routes.
              </p>
            </header>

            {/* Balances Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {["ALGO", "USDC", "USDT"].map((symbol) => (
                <motion.div 
                  key={symbol}
                  whileHover={{ y: -5 }}
                  className={`p-6 rounded-3xl border ${selectedToken === symbol ? 'border-primary bg-primary/5 shadow-[0_0_30px_rgba(var(--primary),0.1)]' : 'border-white/10 bg-white/5'} transition-all cursor-pointer`}
                  onClick={() => setSelectedToken(symbol as any)}
                >
                  <div className="flex justify-between items-start mb-4">
                    <CryptoLogo symbol={symbol} size="md" />
                    <div className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest ${selectedToken === symbol ? 'bg-primary text-black' : 'bg-white/10 text-white/40'}`}>
                      {symbol}
                    </div>
                  </div>
                  <h3 className="text-white/50 text-xs font-bold uppercase tracking-widest mb-1">Vault Balance</h3>
                  <p className="text-2xl font-mono font-bold text-white mb-2">
                    {vaultLoading ? "---" : getFormattedBalance(symbol)}
                  </p>
                  <div className="text-[10px] text-muted-foreground flex items-center justify-between">
                    <span>Wallet: {getFormattedBalance(symbol, true).split(' ')[0]}</span>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Asset Opt-in Section */}
            {showOptInSection && (
              <div className="p-6 rounded-3xl border border-primary/20 bg-primary/5 flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-4 text-sm text-primary font-bold tracking-wide uppercase">
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                  Ensure you have opted-in to required assets on Algorand.
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="bg-primary/10 border-primary/40 text-primary font-bold" onClick={() => handleOptIn('USDC')}>
                    USDC
                  </Button>
                  <Button variant="outline" size="sm" className="bg-primary/10 border-primary/40 text-primary font-bold" onClick={() => handleOptIn('USDT')}>
                    USDT
                  </Button>
                  <Button variant="outline" size="sm" className="bg-primary/10 border-primary/40 text-primary font-bold" onClick={() => handleOptIn('VAULT')}>
                    VAULT
                  </Button>
                </div>
              </div>
            )}
            {optInSuccess && (
              <Alert className="bg-green-500/10 border-green-500 text-green-500 rounded-2xl">
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>{optInSuccess}</AlertDescription>
              </Alert>
            )}

            {/* Deposit/Withdraw Tabs */}
            <Tabs defaultValue="deposit" className="w-full">
              <TabsList className="w-full bg-white/5 p-1 rounded-2xl border border-white/10">
                <TabsTrigger value="deposit" className="w-1/2 py-3 rounded-xl font-bold uppercase tracking-widest data-[state=active]:bg-primary data-[state=active]:text-black transition-all">
                  <Download className="w-4 h-4 mr-2" />
                  Deposit
                </TabsTrigger>
                <TabsTrigger value="withdraw" className="w-1/2 py-3 rounded-xl font-bold uppercase tracking-widest data-[state=active]:bg-primary data-[state=active]:text-black transition-all">
                  <Upload className="w-4 h-4 mr-2" />
                  Withdraw
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="deposit" className="mt-8 space-y-6">
                <div className="p-8 rounded-3xl border border-white/10 bg-white/5 backdrop-blur-sm">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold text-white uppercase tracking-tight">Deposit {selectedToken}</h3>
                    <CryptoLogo symbol={selectedToken} size="sm" />
                  </div>
                  
                  <div className="space-y-4 mb-6">
                    <div>
                      <div className="flex justify-between text-xs font-bold uppercase tracking-widest text-white/50 mb-2 px-1">
                        <span>Amount</span>
                        <span>Wallet: {getFormattedBalance(selectedToken, true)}</span>
                      </div>
                      <div className="relative">
                        <Input 
                          type="number" 
                          placeholder="0.00" 
                          className="h-16 text-2xl font-mono bg-black/40 border-white/10 rounded-2xl focus:border-primary transition-all pr-24"
                          value={depositAmount}
                          onChange={(e) => setDepositAmount(e.target.value)}
                        />
                        <button 
                          className="absolute right-4 top-1/2 -translate-y-1/2 px-3 py-1 bg-primary/20 text-primary text-xs font-bold rounded-lg hover:bg-primary/30 transition-all uppercase tracking-widest"
                          onClick={() => handleSetMax(true)}
                        >
                          Max
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-4 gap-2">
                      {[25, 50, 75, 100].map(p => (
                        <Button key={p} variant="outline" size="sm" onClick={() => setPercentage(p, true)} className="border-white/10 bg-white/5 hover:bg-primary/10">
                          {p}%
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>

                <Button
                  variant="glow"
                  onClick={handleDeposit}
                  disabled={!depositAmount || smartContract.isProcessing}
                  className="w-full py-8 text-xl font-hero font-bold rounded-2xl"
                >
                  {smartContract.isProcessing ? 'Processing...' : `DEPOSIT ${selectedToken}`}
                </Button>
              </TabsContent>

              <TabsContent value="withdraw" className="mt-8 space-y-6">
                <div className="p-8 rounded-3xl border border-white/10 bg-white/5 backdrop-blur-sm">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold text-white uppercase tracking-tight">Withdraw {selectedToken}</h3>
                    <CryptoLogo symbol={selectedToken} size="sm" />
                  </div>
                  
                  <div className="space-y-4 mb-6">
                    <div>
                      <div className="flex justify-between text-xs font-bold uppercase tracking-widest text-white/50 mb-2 px-1">
                        <span>Amount</span>
                        <span>Vault: {getFormattedBalance(selectedToken)}</span>
                      </div>
                      <div className="relative">
                        <Input 
                          type="number" 
                          placeholder="0.00" 
                          className="h-16 text-2xl font-mono bg-black/40 border-white/10 rounded-2xl focus:border-primary transition-all pr-24"
                          value={withdrawAmount}
                          onChange={(e) => setWithdrawAmount(e.target.value)}
                        />
                        <button 
                          className="absolute right-4 top-1/2 -translate-y-1/2 px-3 py-1 bg-primary/20 text-primary text-xs font-bold rounded-lg hover:bg-primary/30 transition-all uppercase tracking-widest"
                          onClick={() => handleSetMax(false)}
                        >
                          Max
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-4 gap-2">
                      {[25, 50, 75, 100].map(p => (
                        <Button key={p} variant="outline" size="sm" onClick={() => setPercentage(p, false)} className="border-white/10 bg-white/5 hover:bg-primary/10">
                          {p}%
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>

                <Button
                  variant="hero"
                  onClick={handleWithdraw}
                  disabled={!withdrawAmount || smartContract.isProcessing}
                  className="w-full py-8 text-xl font-hero font-bold rounded-2xl"
                >
                  {smartContract.isProcessing ? 'Processing...' : `WITHDRAW ${selectedToken}`}
                </Button>
              </TabsContent>
            </Tabs>
          </div>

          {/* Right Column: Security & History */}
          <div className="space-y-8">
            <div className="rounded-3xl border border-white/10 bg-white/5 p-8 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-2 h-full bg-primary" />
              <h2 className="font-hero text-xl font-bold tracking-tight text-white mb-6 flex items-center gap-3">
                <ShieldCheck className="w-5 h-5 text-primary" />
                SECURITY
              </h2>
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <span className="text-primary font-bold text-xs">01</span>
                  </div>
                  <div>
                    <h3 className="text-white font-bold text-sm mb-1 uppercase tracking-wider">Smart Contract</h3>
                    <p className="text-muted-foreground text-xs leading-relaxed">
                      Assets are held in an audited Algorand smart contract.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <span className="text-primary font-bold text-xs">02</span>
                  </div>
                  <div>
                    <h3 className="text-white font-bold text-sm mb-1 uppercase tracking-wider">Non-Custodial</h3>
                    <p className="text-muted-foreground text-xs leading-relaxed">
                      Withdraw your funds at any time, instantly.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <Card className="bg-black/40 border-white/10 text-white rounded-3xl overflow-hidden">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-primary uppercase tracking-widest text-sm font-bold">History</CardTitle>
                <Button variant="ghost" size="sm" onClick={fetchTransactions} disabled={loadingTransactions}>
                  <RefreshCw className={`h-4 w-4 ${loadingTransactions ? 'animate-spin' : ''}`} />
                </Button>
              </CardHeader>
              <CardContent>
                {loadingTransactions ? (
                  <div className="text-center py-8 text-muted-foreground text-xs">SYNCING...</div>
                ) : transactions.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground text-xs">NO ENTRIES</div>
                ) : (
                  <div className="space-y-3">
                    {transactions.map((tx) => {
                      const isProfit = tx.transactionHash.startsWith('PROFIT-');
                      return (
                        <div key={tx._id} className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5 hover:border-primary/30 transition-all">
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg ${isProfit ? 'bg-yellow-500/10 text-yellow-500' : tx.type === 'deposit' ? 'bg-green-500/10 text-green-500' : 'bg-blue-500/10 text-blue-500'}`}>
                              {isProfit ? "💰" : tx.type === 'deposit' ? <Download className="h-3 w-3" /> : <Upload className="h-3 w-3" />}
                            </div>
                            <div>
                              <p className="font-bold uppercase text-[10px]">{isProfit ? 'Profit' : tx.type}</p>
                              <p className="text-[8px] text-muted-foreground font-mono">{new Date(tx.timestamp || tx.createdAt || "").toLocaleDateString()}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className={`font-mono font-bold text-xs ${isProfit || tx.type === 'deposit' ? 'text-green-400' : 'text-red-400'}`}>
                              {isProfit || tx.type === 'deposit' ? '+' : '-'}{tx.amountFormatted.toFixed(2)}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Vault;
