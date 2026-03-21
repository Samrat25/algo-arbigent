import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowLeft, Download, Upload, Wallet, CheckCircle, AlertCircle, RefreshCw } from "lucide-react";
import Header from "@/components/Header";
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
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4 lg:px-8 max-w-6xl">
          <div className="mb-8">
            <Link to="/dashboard" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Link>
            <h1 className="text-4xl font-bold mb-2">Vault</h1>
            <p className="text-muted-foreground">Manage your crypto assets securely</p>
          </div>

          {/* Opt-in Section */}
          {showOptInSection && (
            <Card className="mb-6 border-primary/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-primary" />
                  Asset Setup Required
                </CardTitle>
                <CardDescription>
                  Before depositing USDC or USDT, you need to opt-in to these assets
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {optInSuccess && (
                  <Alert className="border-green-500 bg-green-50">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <AlertDescription className="text-green-800">{optInSuccess}</AlertDescription>
                  </Alert>
                )}
                
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    Opt-in allows your wallet to receive and hold these tokens. This is a one-time setup.
                  </AlertDescription>
                </Alert>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Button
                    variant="outline"
                    onClick={() => handleOptIn('USDC')}
                    disabled={smartContract.isProcessing}
                    className="w-full"
                  >
                    {smartContract.isProcessing ? 'Processing...' : 'Opt-in to USDC'}
                  </Button>
                  
                  <Button
                    variant="outline"
                    onClick={() => handleOptIn('USDT')}
                    disabled={smartContract.isProcessing}
                    className="w-full"
                  >
                    {smartContract.isProcessing ? 'Processing...' : 'Opt-in to USDT'}
                  </Button>
                  
                  <Button
                    variant="outline"
                    onClick={() => handleOptIn('VAULT')}
                    disabled={smartContract.isProcessing}
                    className="w-full"
                  >
                    {smartContract.isProcessing ? 'Processing...' : 'Opt-in to Vault'}
                  </Button>
                </div>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowOptInSection(false)}
                  className="w-full"
                >
                  Hide this section
                </Button>
              </CardContent>
            </Card>
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
          <Card className="mb-6">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Your Balances</CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={refreshVault}
                disabled={vaultLoading}
              >
                <RefreshCw className={`h-4 w-4 ${vaultLoading ? 'animate-spin' : ''}`} />
              </Button>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {supportedTokens.map((token) => {
                  const vaultBalance = getFormattedBalance(token.symbol);
                  const walletBalance = balances[token.symbol] || '0';
                  
                  return (
                    <div
                      key={token.symbol}
                      className={`p-4 rounded-lg border-2 transition-all cursor-pointer ${
                        selectedToken === token.symbol
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-primary/50'
                      }`}
                      onClick={() => setSelectedToken(token.symbol)}
                    >
                      <div className="flex items-center gap-3 mb-3">
                        <CryptoLogo symbol={token.symbol} size="sm" />
                        <div>
                          <h3 className="font-semibold text-sm">{token.symbol}</h3>
                          <p className="text-xs text-muted-foreground">{token.name}</p>
                        </div>
                      </div>
                      
                      {/* Vault Balance */}
                      <div className="mb-3 pb-3 border-b border-border/50">
                        <p className="text-xs text-muted-foreground mb-1">Vault Balance</p>
                        <p className="text-2xl font-bold text-primary">
                          {vaultLoading ? '...' : vaultBalance}
                        </p>
                      </div>
                      
                      {/* Wallet Balance */}
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Wallet Balance</p>
                        <p className="text-lg font-semibold">{walletBalance}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Deposit/Withdraw Tabs */}
          <Card>
            <CardContent className="pt-6">
              <Tabs defaultValue="deposit">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="deposit">
                    <Download className="h-4 w-4 mr-2" />
                    Deposit
                  </TabsTrigger>
                  <TabsTrigger value="withdraw">
                    <Upload className="h-4 w-4 mr-2" />
                    Withdraw
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="deposit" className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Amount</label>
                    <Input
                      type="number"
                      placeholder="0.00"
                      value={depositAmount}
                      onChange={(e) => setDepositAmount(e.target.value)}
                      disabled={smartContract.isProcessing}
                    />
                  </div>
                  
                  <div className="flex gap-2">
                    {[25, 50, 75, 100].map((percent) => (
                      <Button
                        key={percent}
                        variant="outline"
                        size="sm"
                        onClick={() => setPercentage(percent, true)}
                        disabled={smartContract.isProcessing}
                      >
                        {percent}%
                      </Button>
                    ))}
                  </div>

                  {smartContract.error && (
                    <div className="text-sm text-destructive">
                      {smartContract.error}
                    </div>
                  )}

                  <Button
                    onClick={handleDeposit}
                    disabled={!depositAmount || smartContract.isProcessing}
                    className="w-full"
                  >
                    {smartContract.isProcessing ? 'Processing...' : `Deposit ${selectedToken}`}
                  </Button>
                </TabsContent>

                <TabsContent value="withdraw" className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Amount</label>
                    <Input
                      type="number"
                      placeholder="0.00"
                      value={withdrawAmount}
                      onChange={(e) => setWithdrawAmount(e.target.value)}
                      disabled={smartContract.isProcessing}
                    />
                  </div>
                  
                  <div className="flex gap-2">
                    {[25, 50, 75, 100].map((percent) => (
                      <Button
                        key={percent}
                        variant="outline"
                        size="sm"
                        onClick={() => setPercentage(percent, false)}
                        disabled={smartContract.isProcessing}
                      >
                        {percent}%
                      </Button>
                    ))}
                  </div>

                  {smartContract.error && (
                    <div className="text-sm text-destructive">
                      {smartContract.error}
                    </div>
                  )}

                  <Button
                    onClick={handleWithdraw}
                    disabled={!withdrawAmount || smartContract.isProcessing}
                    className="w-full"
                  >
                    {smartContract.isProcessing ? 'Processing...' : `Withdraw ${selectedToken}`}
                  </Button>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* Info Card */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Important Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>• You must opt-in to USDC and USDT assets before depositing them</p>
              <p>• Minimum balance requirements apply for Algorand accounts</p>
              <p>• Transaction fees are approximately 0.001 ALGO per transaction</p>
              <p>• Connected to Algorand Testnet</p>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Vault;
