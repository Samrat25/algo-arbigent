import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowLeft, Download, Upload, Wallet, CheckCircle, AlertCircle, RefreshCw, Sparkles, ShieldCheck } from "lucide-react";
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

const Vault = () => {
  const { account, connected, balances, smartContract } = useAlgorandWallet();
  const { vault, isLoading: vaultLoading, refreshVault, getFormattedBalance } = useVault();
  const [selectedToken, setSelectedToken] = useState<"ALGO" | "USDC" | "USDT">("ALGO");
  const [depositAmount, setDepositAmount] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [showOptInSection, setShowOptInSection] = useState(true);
  const [optInSuccess, setOptInSuccess] = useState<string | null>(null);

  // Refresh vault on mount and after transactions
  useEffect(() => {
    if (connected && account?.address) {
      refreshVault();
    }
  }, [connected, account?.address, refreshVault]);

  const handleOptIn = async (type: 'USDC' | 'USDT' | 'VAULT') => {
    setOptInSuccess(null);
    smartContract.clearError(); // Clear any previous errors
    let success = false;
    
    if (type === 'VAULT') {
      success = await smartContract.optInToApp();
      if (success) {
        const msg = smartContract.error?.includes('Already') 
          ? 'Already opted into Vault!' 
          : 'Successfully opted into Vault!';
        setOptInSuccess(msg);
        smartContract.clearError(); // Clear the "already opted in" error
      }
    } else {
      const assetId = type === 'USDC' ? USDC_ASSET_ID : USDT_ASSET_ID;
      success = await smartContract.optInToAsset(assetId, type);
      if (success) {
        const msg = smartContract.error?.includes('Already')
          ? `Already opted into ${type}!`
          : `Successfully opted into ${type}!`;
        setOptInSuccess(msg);
        smartContract.clearError(); // Clear the "already opted in" error
      }
    }
    
    if (success) {
      setTimeout(() => setOptInSuccess(null), 3000);
    }
  };

  const supportedTokens = [
    { symbol: "ALGO" as const, name: "Algorand" },
    { symbol: "USDC" as const, name: "USD Coin" },
    { symbol: "USDT" as const, name: "Tether USD" },
  ];

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
        // Refresh vault balance after deposit
        setTimeout(() => refreshVault(), 2000);
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
        // Refresh vault balance after withdraw
        setTimeout(() => refreshVault(), 2000);
      }
    } catch (err) {
      console.error('Withdraw error:', err);
    }
  };

  const setPercentage = (percentage: number, isDeposit: boolean) => {
    const balance = balances[selectedToken] || '0';
    const amount = (parseFloat(balance) * percentage / 100).toFixed(6);
    if (isDeposit) {
      setDepositAmount(amount);
    } else {
      setWithdrawAmount(amount);
    }
  };

  if (!connected) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <Wallet className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <CardTitle>Wallet Not Connected</CardTitle>
            <CardDescription>Connect your Algorand wallet to access the vault</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background dark text-foreground relative overflow-hidden selection:bg-primary/30">
      <GlobalBackground />
      <Navbar />
      
      <main className="pt-32 pb-16 relative z-10">
        <div className="container mx-auto px-6 lg:px-12 max-w-7xl">
          <div className="mb-12">
            <Link to="/dashboard" className="inline-flex items-center text-sm text-primary hover:text-primary/80 transition-colors mb-6 group">
              <ArrowLeft className="h-4 w-4 mr-2 transition-transform group-hover:-translate-x-1" />
              BACK TO COMMAND CENTER
            </Link>
            <h1 className="font-hero text-4xl lg:text-6xl font-bold tracking-tight text-white mb-4 uppercase">
              Secure <span className="text-primary glow-text">Vault</span>
            </h1>
            <p className="text-muted-foreground text-lg max-w-2xl">Manage your cryptographic assets with institutional-grade security.</p>
          </div>

          {/* Opt-in Section */}
          {showOptInSection && (
            <div className="mb-12 rounded-3xl border border-primary/50 bg-primary/5 backdrop-blur-xl p-8 shadow-[0_0_20px_rgba(255,138,0,0.1)] relative overflow-hidden">
               <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-2xl -mr-16 -mt-16" />
              
              <div className="relative z-10">
                <h2 className="font-hero text-2xl font-bold tracking-tight text-white mb-2 flex items-center gap-3">
                  <Sparkles className="h-6 w-6 text-primary animate-pulse" />
                  INITIAL SETUP REQUIRED
                </h2>
                <p className="text-muted-foreground mb-8 text-sm">Activate your secure vault by opting into the required smart contracts and asset types.</p>

                {optInSuccess && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="mb-8 p-4 rounded-xl border border-green-500/30 bg-green-500/10 flex items-center gap-3 text-green-400"
                  >
                    <CheckCircle className="h-5 w-5 shrink-0" />
                    <span className="text-sm font-medium">{optInSuccess}</span>
                  </motion.div>
                )}
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                  {[
                    { id: 'USDC', label: 'Activate USDC' },
                    { id: 'USDT', label: 'Activate USDT' },
                    { id: 'VAULT', label: 'Connect Vault' }
                  ].map((opt) => (
                    <Button
                      key={opt.id}
                      variant="heroOutline"
                      onClick={() => handleOptIn(opt.id as any)}
                      disabled={smartContract.isProcessing}
                      className="w-full py-6"
                    >
                      {smartContract.isProcessing ? 'Processing...' : opt.label}
                    </Button>
                  ))}
                </div>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowOptInSection(false)}
                  className="w-full text-muted-foreground hover:text-white transition-colors uppercase tracking-widest text-[10px] font-bold"
                >
                  Skip for now
                </Button>
              </div>
            </div>
          )}

          {smartContract.error && (
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{smartContract.error}</AlertDescription>
            </Alert>
          )}

          {/* Token Selection */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Select Token</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                {supportedTokens.map((token) => (
                  <Button
                    key={token.symbol}
                    variant={selectedToken === token.symbol ? "default" : "outline"}
                    onClick={() => setSelectedToken(token.symbol)}
                    className="w-full"
                  >
                    {token.symbol}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Balance Display */}
          <div className="mb-12 rounded-3xl border border-primary bg-black/40 backdrop-blur-xl p-8 shadow-[0_0_20px_rgba(255,138,0,0.15)]">
            <div className="flex items-center justify-between mb-8">
              <h2 className="font-hero text-2xl font-bold tracking-tight text-white flex items-center gap-3">
                <Wallet className="h-6 w-6 text-primary" />
                ASSET OVERVIEW
              </h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={refreshVault}
                disabled={vaultLoading}
                className="text-primary hover:text-primary hover:bg-white/5"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${vaultLoading ? 'animate-spin' : ''}`} />
                REFRESH
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {supportedTokens.map((token) => {
                const vaultBalance = getFormattedBalance(token.symbol);
                const walletBalance = balances[token.symbol] || '0';
                const isSelected = selectedToken === token.symbol;
                
                return (
                  <motion.div
                    key={token.symbol}
                    whileHover={{ y: -5 }}
                    className={`p-6 rounded-2xl border-2 transition-all duration-300 cursor-pointer relative overflow-hidden group ${
                      isSelected
                        ? 'border-primary bg-primary/10 shadow-[0_0_20px_rgba(255,138,0,0.2)]'
                        : 'border-white/10 bg-white/5 hover:border-primary/50'
                    }`}
                    onClick={() => setSelectedToken(token.symbol)}
                  >
                    {isSelected && (
                      <div className="absolute top-3 right-3">
                        <CheckCircle className="h-5 w-5 text-primary" />
                      </div>
                    )}

                    <div className="flex items-center gap-4 mb-6 relative z-10">
                      <CryptoLogo symbol={token.symbol} size="md" />
                      <div>
                        <h3 className="font-hero text-xl font-bold text-white tracking-tight">{token.symbol}</h3>
                        <p className="text-xs text-muted-foreground uppercase tracking-widest font-medium">{token.name}</p>
                      </div>
                    </div>
                    
                    {/* Vault Balance */}
                    <div className="mb-6 pb-6 border-b border-white/5 relative z-10">
                      <p className="text-[10px] text-muted-foreground mb-2 uppercase tracking-widest font-bold">SECURE VAULT</p>
                      <p className="text-3xl font-bold text-primary group-hover:glow-text transition-all">
                        {vaultLoading ? '...' : vaultBalance}
                      </p>
                    </div>
                    
                    {/* Wallet Balance */}
                    <div className="relative z-10">
                      <p className="text-[10px] text-muted-foreground mb-2 uppercase tracking-widest font-bold">LIQUID WALLET</p>
                      <p className="text-xl font-bold text-white opacity-80">{walletBalance}</p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* Deposit/Withdraw Tabs */}
          <div className="rounded-3xl border border-primary bg-black/40 backdrop-blur-xl p-8 shadow-[0_0_20px_rgba(255,138,0,0.15)] mb-12">
            <Tabs defaultValue="deposit">
              <TabsList className="grid w-full grid-cols-2 p-1 bg-white/5 rounded-2xl mb-8 border border-white/10">
                <TabsTrigger value="deposit" className="py-4 rounded-xl data-[state=active]:bg-primary data-[state=active]:text-black font-hero font-bold tracking-wider">
                  <Download className="h-4 w-4 mr-2" />
                  DEPOSIT
                </TabsTrigger>
                <TabsTrigger value="withdraw" className="py-4 rounded-xl data-[state=active]:bg-primary data-[state=active]:text-black font-hero font-bold tracking-wider">
                  <Upload className="h-4 w-4 mr-2" />
                  WITHDRAW
                </TabsTrigger>
              </TabsList>

              <TabsContent value="deposit" className="space-y-8 animate-in fade-in slide-in-from-bottom-2">
                <div>
                  <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3 block">Enter Deposit Amount ({selectedToken})</label>
                  <div className="relative">
                    <Input
                      type="number"
                      placeholder="0.00"
                      value={depositAmount}
                      onChange={(e) => setDepositAmount(e.target.value)}
                      disabled={smartContract.isProcessing}
                      className="bg-white/5 border-white/10 text-white font-mono text-2xl py-8 rounded-2xl focus:border-primary transition-all pr-16"
                    />
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-primary font-bold">MAX</div>
                  </div>
                </div>
                
                <div className="grid grid-cols-4 gap-4">
                  {[25, 50, 75, 100].map((percent) => (
                    <Button
                      key={percent}
                      variant="heroOutline"
                      size="sm"
                      onClick={() => setPercentage(percent, true)}
                      disabled={smartContract.isProcessing}
                      className="py-6 rounded-xl border-white/10 bg-white/5 hover:bg-primary hover:text-black transition-all font-mono font-bold"
                    >
                      {percent}%
                    </Button>
                  ))}
                </div>

                <Button
                  variant="hero"
                  onClick={handleDeposit}
                  disabled={!depositAmount || smartContract.isProcessing}
                  className="w-full py-8 text-xl font-hero font-bold rounded-2xl shadow-[0_0_20px_rgba(255,138,0,0.3)]"
                >
                  {smartContract.isProcessing ? 'Processing Transaction...' : `DEPOSIT ${selectedToken} TO VAULT`}
                </Button>
              </TabsContent>

              <TabsContent value="withdraw" className="space-y-8 animate-in fade-in slide-in-from-bottom-2">
                <div>
                  <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3 block">Enter Withdrawal Amount ({selectedToken})</label>
                  <div className="relative">
                    <Input
                      type="number"
                      placeholder="0.00"
                      value={withdrawAmount}
                      onChange={(e) => setWithdrawAmount(e.target.value)}
                      disabled={smartContract.isProcessing}
                      className="bg-white/5 border-white/10 text-white font-mono text-2xl py-8 rounded-2xl focus:border-primary transition-all pr-16"
                    />
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-primary font-bold">MAX</div>
                  </div>
                </div>
                
                <div className="grid grid-cols-4 gap-4">
                  {[25, 50, 75, 100].map((percent) => (
                    <Button
                      key={percent}
                      variant="heroOutline"
                      size="sm"
                      onClick={() => setPercentage(percent, false)}
                      disabled={smartContract.isProcessing}
                      className="py-6 rounded-xl border-white/10 bg-white/5 hover:bg-primary hover:text-black transition-all font-mono font-bold"
                    >
                      {percent}%
                    </Button>
                  ))}
                </div>

                <Button
                  variant="hero"
                  onClick={handleWithdraw}
                  disabled={!withdrawAmount || smartContract.isProcessing}
                  className="w-full py-8 text-xl font-hero font-bold rounded-2xl shadow-[0_0_20px_rgba(255,138,0,0.3)]"
                >
                  {smartContract.isProcessing ? 'Processing Transaction...' : `WITHDRAW ${selectedToken} FROM VAULT`}
                </Button>
              </TabsContent>
            </Tabs>
          </div>

          {/* Info Card */}
          <div className="rounded-3xl border border-white/10 bg-white/5 p-8 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-2 h-full bg-primary" />
            <h2 className="font-hero text-xl font-bold tracking-tight text-white mb-6 flex items-center gap-3">
              <ShieldCheck className="h-5 w-5 text-primary" />
              SECURITY PROTOCOLS
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-muted-foreground font-medium">
              <div className="flex items-start gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                <p>One-time asset opt-in required for secure bridging.</p>
              </div>
              <div className="flex items-start gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                <p>Institutional minimum balance protections enforced.</p>
              </div>
              <div className="flex items-start gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                <p>Nanosecond execution on Algorand Testnet V3.</p>
              </div>
              <div className="flex items-start gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                <p>Transactions non-custodial and verified on-chain.</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Vault;
