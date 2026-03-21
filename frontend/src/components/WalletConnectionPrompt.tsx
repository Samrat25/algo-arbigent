import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Wallet, Shield, ArrowRight } from 'lucide-react';
import { useAlgorandWallet as useWallet } from '@/contexts/AlgorandWalletContext';
import { WalletModal } from '@/components/WalletModal';

interface WalletConnectionPromptProps {
  title?: string;
  description?: string;
  targetRoute?: string;
  className?: string;
}

export const WalletConnectionPrompt: React.FC<WalletConnectionPromptProps> = ({
  title = "Connect Your Wallet",
  description = "Connect your Algorand wallet to access all features of Arbigent.",
  targetRoute,
  className = ""
}) => {
  const { connected, connecting } = useWallet();
  const navigate = useNavigate();
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);

  const handleConnect = () => {
    if (targetRoute) {
      // Store the target route for redirect after connection
      sessionStorage.setItem('redirectAfterConnection', targetRoute);
    }
    setIsWalletModalOpen(true);
  };

  // If already connected, show success state
  if (connected) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="flex items-center space-x-3 text-green-600">
            <Shield className="h-5 w-5" />
            <span className="font-medium">Wallet Connected Successfully!</span>
          </div>
          {targetRoute && (
            <Button 
              onClick={() => navigate(targetRoute)} 
              className="mt-4 w-full"
            >
              Continue to {targetRoute.replace('/', '').charAt(0).toUpperCase() + targetRoute.slice(2)}
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className={className}>
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
              <Wallet className="h-8 w-8 text-primary" />
            </div>
          </div>
          <CardTitle className="text-xl">{title}</CardTitle>
          <p className="text-muted-foreground">{description}</p>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <Alert>
            <Shield className="h-4 w-4" />
            <AlertDescription>
              Your wallet connection is secure and encrypted. We never store your private keys.
            </AlertDescription>
          </Alert>
          
          <div className="space-y-3">
            <Button 
              onClick={handleConnect} 
              className="w-full"
              disabled={connecting}
              size="lg"
            >
              <Wallet className="h-4 w-4 mr-2" />
              {connecting ? 'Connecting...' : 'Connect Wallet'}
            </Button>
          </div>
          
          <div className="text-xs text-muted-foreground text-center space-y-1">
            <p>Supported wallets: Pera, Defly, Lute</p>
            <p className="text-primary">Algorand Testnet</p>
          </div>
        </CardContent>
      </Card>
      
      <WalletModal 
        open={isWalletModalOpen} 
        onOpenChange={setIsWalletModalOpen}
      />
    </>
  );
};

// Compact version for inline use
export const WalletConnectionPromptCompact: React.FC<{
  onConnect?: () => void;
  className?: string;
}> = ({ onConnect, className = "" }) => {
  const { connected, connecting } = useWallet();
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);

  if (connected) {
    return null;
  }

  const handleConnect = () => {
    setIsWalletModalOpen(true);
    if (onConnect) {
      onConnect();
    }
  };

  return (
    <>
      <div className={`flex items-center space-x-2 ${className}`}>
        <span className="text-sm text-muted-foreground">Connect wallet to continue:</span>
        <Button 
          size="sm" 
          onClick={handleConnect}
          disabled={connecting}
        >
          <Wallet className="h-3 w-3 mr-1" />
          {connecting ? 'Connecting...' : 'Connect'}
        </Button>
      </div>
      
      <WalletModal 
        open={isWalletModalOpen} 
        onOpenChange={setIsWalletModalOpen}
      />
    </>
  );
};

export default WalletConnectionPrompt;