import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAlgorandWallet } from '@/contexts/AlgorandWalletContext';
import { WalletConnecting } from '@/components/LoadingStates';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Wallet, ArrowLeft } from 'lucide-react';
import { WalletModal } from '@/components/WalletModal';

interface ProtectedRouteProps {
  children: React.ReactNode;
  redirectTo?: string;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  redirectTo = '/' 
}) => {
  const { connected, connecting, error, clearError, wallets } = useAlgorandWallet();
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);
  const [hasCheckedConnection, setHasCheckedConnection] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const defaultWallet = wallets[0]?.name || 'Pera';

  // Clear any existing errors when the component mounts
  useEffect(() => {
    if (error) {
      clearError();
    }
  }, []);

  // Handle connection state changes
  useEffect(() => {
    if (!connecting) {
      setHasCheckedConnection(true);
    }

    // If connected and we're on a protected route, ensure we stay there
    if (connected && hasCheckedConnection) {
      console.log('ProtectedRoute: Wallet connected, rendering protected content');
    }
  }, [connected, connecting, hasCheckedConnection]);

  // If wallet is connecting, show loading state
  if (connecting) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <WalletConnecting 
          walletName={defaultWallet}
          className="w-full max-w-md"
        />
      </div>
    );
  }

  // If wallet is not connected and we've checked, show connection prompt
  if (!connected && hasCheckedConnection) {
    return (
      <>
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Wallet className="h-6 w-6 text-primary" />
                </div>
              </div>
              <CardTitle>Wallet Connection Required</CardTitle>
              <CardDescription>
                You need to connect your Algorand wallet to access this page.
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <Button 
                  onClick={() => setIsWalletModalOpen(true)} 
                  className="w-full"
                  disabled={connecting}
                >
                  <Wallet className="h-4 w-4 mr-2" />
                  Connect Wallet
                </Button>
                
                <Button 
                  variant="outline" 
                  onClick={() => navigate(redirectTo)}
                  className="w-full"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Home
                </Button>
              </div>
              
              <div className="text-xs text-muted-foreground text-center space-y-1">
                <p>Supported wallets: Pera, Defly, Lute</p>
                <p className="text-primary">Algorand Testnet</p>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <WalletModal 
          open={isWalletModalOpen} 
          onOpenChange={setIsWalletModalOpen}
        />
      </>
    );
  }

  // If wallet is connected, render the protected content
  if (connected) {
    return <>{children}</>;
  }

  // Still checking connection state
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <WalletConnecting 
        walletName={defaultWallet}
        className="w-full max-w-md"
      />
    </div>
  );
};

export default ProtectedRoute;
