import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAlgorandWallet } from '@/contexts/AlgorandWalletContext';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Wallet, ExternalLink, Loader2 } from 'lucide-react';
import { Card } from '@/components/ui/card';

interface WalletModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const WALLET_OPTIONS = [
  {
    id: 'pera',
    name: 'Pera Wallet',
    description: 'Mobile & Browser wallet',
    icon: '🟦', // You can replace with actual logo
    downloadUrl: 'https://perawallet.app/',
    color: 'from-blue-500 to-blue-600'
  },
  {
    id: 'defly',
    name: 'Defly Wallet',
    description: 'DeFi-focused wallet',
    icon: '🦋', // You can replace with actual logo
    downloadUrl: 'https://defly.app/',
    color: 'from-purple-500 to-purple-600'
  },
  {
    id: 'lute',
    name: 'Lute Wallet',
    description: 'Browser extension',
    icon: '🎵', // You can replace with actual logo
    downloadUrl: 'https://lute.app/',
    color: 'from-green-500 to-green-600'
  }
];

export function WalletModal({ open, onOpenChange }: WalletModalProps) {
  const { connect, connecting, error, clearError, connected } = useAlgorandWallet();
  const [selectedWallet, setSelectedWallet] = useState<string | null>(null);
  const [isNavigating, setIsNavigating] = useState(false);
  const [shouldNavigate, setShouldNavigate] = useState(false);
  const navigate = useNavigate();

  // Effect to handle navigation when connection is successful
  useEffect(() => {
    if (shouldNavigate && connected && !connecting) {
      console.log('WalletModal: Connection confirmed, navigating to dashboard');
      setIsNavigating(true);
      onOpenChange(false);
      
      // Small delay to ensure modal closes
      setTimeout(() => {
        navigate('/dashboard', { replace: true });
        setShouldNavigate(false);
        setSelectedWallet(null);
        setIsNavigating(false);
      }, 300);
    }
  }, [connected, connecting, shouldNavigate, navigate, onOpenChange]);

  const handleConnect = async (walletId: string) => {
    // Prevent double connection attempts
    if (connecting || isNavigating) {
      console.log('WalletModal: Already connecting or navigating, ignoring');
      return;
    }

    try {
      setSelectedWallet(walletId);
      clearError();
      setShouldNavigate(true);
      console.log('WalletModal: Connecting to', walletId);
      await connect(walletId);
      console.log('WalletModal: Connection request completed');
    } catch (err) {
      console.error('WalletModal: Connection error:', err);
      setSelectedWallet(null);
      setIsNavigating(false);
      setShouldNavigate(false);
    }
  };

  const handleDownload = (url: string) => {
    window.open(url, '_blank');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            Connect Wallet
          </DialogTitle>
          <DialogDescription>
            Choose a wallet to connect to Arbigent on Algorand Testnet
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-4">
          {WALLET_OPTIONS.map((wallet) => (
            <Card
              key={wallet.id}
              className="p-4 hover:border-primary transition-colors cursor-pointer"
              onClick={() => !connecting && !isNavigating && handleConnect(wallet.id)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${wallet.color} flex items-center justify-center text-2xl`}>
                    {wallet.icon}
                  </div>
                  <div>
                    <h3 className="font-semibold">{wallet.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {wallet.description}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  {connecting && selectedWallet === wallet.id ? (
                    <Loader2 className="h-5 w-5 animate-spin text-primary" />
                  ) : (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDownload(wallet.downloadUrl);
                      }}
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>

        {error && (
          <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
        )}

        <div className="text-xs text-muted-foreground text-center space-y-1">
          <p>By connecting, you agree to our Terms of Service</p>
          <p className="text-primary">Connected to Algorand Testnet</p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
