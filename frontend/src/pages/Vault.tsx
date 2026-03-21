import { useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowLeft, Download, Upload, Wallet } from "lucide-react";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAlgorandWallet } from '@/contexts/AlgorandWalletContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const Vault = () => {
  const { account, connected, balances, smartContract } = useAlgorandWallet();
  const [selectedToken, setSelectedToken] = useState<"ALGO" | "USDC" | "USDT">("ALGO");
  const [depositAmount, setDepositAmount] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");

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
            <CardHeader>
              <CardTitle>Your Balance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {balances[selectedToken]} {selectedToken}
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                Wallet Balance
              </p>
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
