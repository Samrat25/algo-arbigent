import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { Wallet, TrendingUp, Menu, X, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAlgorandWallet } from '@/contexts/AlgorandWalletContext';
import { usePostConnectionRedirect } from "@/hooks/useRouteProtection";
import { WalletModal } from "@/components/WalletModal";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const Header = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);
  const location = useLocation();
  const { connected, account, disconnect, balances, wallet } = useAlgorandWallet();
  
  // Handle post-connection redirects
  usePostConnectionRedirect();
  
  const navLinks = [
    { href: "/dashboard", label: "Dashboard" },
    { href: "/vault", label: "Vault" },
    { href: "/agents", label: "Agents" },
  ];
  
  const isLanding = location.pathname === "/";
  
  const truncateAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const handleDisconnect = async () => {
    try {
      await disconnect();
    } catch (error) {
      console.error('Disconnect failed:', error);
    }
  };

  return (
    <>
      <motion.header 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="fixed top-0 left-0 right-0 z-50 border-b border-border bg-background/95 backdrop-blur-xl"
      >
        <div className="container mx-auto flex h-16 items-center justify-between px-4 lg:px-8">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="relative flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 border border-primary/30 group-hover:border-primary transition-colors">
              <TrendingUp className="h-5 w-5 text-primary" />
            </div>
            <div className="flex flex-col">
              <span className="font-display text-xl font-bold tracking-wide text-foreground">ARBIGENT</span>
              <span className="text-[9px] uppercase tracking-widest text-muted-foreground">Algorand Arbitrage</span>
            </div>
          </Link>
          
          {/* Desktop Navigation */}
          {!isLanding && (
            <nav className="hidden md:flex items-center gap-8">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  to={link.href}
                  className={`font-display text-sm tracking-wide transition-colors hover:text-primary ${
                    location.pathname === link.href 
                      ? "text-primary" 
                      : "text-muted-foreground"
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          )}
          
          {/* Wallet Button */}
          <div className="flex items-center gap-4">
            {connected && account?.address ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="default" className="hidden sm:flex gap-2">
                    <Wallet className="h-4 w-4" />
                    {truncateAddress(account.address)}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-64">
                  <DropdownMenuLabel>
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium">Connected Wallet</p>
                      <p className="text-xs text-muted-foreground">{wallet?.name || 'Algorand Wallet'}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <div className="px-2 py-2 space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">ALGO:</span>
                      <span className="font-medium">{balances.ALGO}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">USDC:</span>
                      <span className="font-medium">{balances.USDC}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">USDT:</span>
                      <span className="font-medium">{balances.USDT}</span>
                    </div>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleDisconnect} className="text-destructive">
                    <LogOut className="h-4 w-4 mr-2" />
                    Disconnect
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button 
                variant="default" 
                size="default" 
                onClick={() => setIsWalletModalOpen(true)}
                className="hidden sm:flex gap-2"
              >
                <Wallet className="h-4 w-4" />
                Connect Wallet
              </Button>
            )}
            
            {/* Mobile Menu Toggle */}
            <button 
              className="md:hidden p-2 text-muted-foreground hover:text-foreground"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
        
        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="md:hidden border-t border-border bg-background"
          >
            <nav className="container mx-auto flex flex-col gap-4 p-4">
              {!isLanding && navLinks.map((link) => (
                <Link
                  key={link.href}
                  to={link.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`font-display text-lg tracking-wide transition-colors hover:text-primary ${
                    location.pathname === link.href 
                      ? "text-primary" 
                      : "text-muted-foreground"
                  }`}
                >
                  {link.label}
                </Link>
              ))}
              
              {connected && account?.address ? (
                <div className="space-y-2 mt-4">
                  <div className="p-3 rounded-lg bg-muted">
                    <p className="text-xs text-muted-foreground mb-2">Connected: {wallet?.name}</p>
                    <p className="text-sm font-mono">{truncateAddress(account.address)}</p>
                    <div className="mt-2 space-y-1 text-xs">
                      <div className="flex justify-between">
                        <span>ALGO:</span>
                        <span>{balances.ALGO}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>USDC:</span>
                        <span>{balances.USDC}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>USDT:</span>
                        <span>{balances.USDT}</span>
                      </div>
                    </div>
                  </div>
                  <Button 
                    variant="destructive" 
                    size="lg" 
                    onClick={handleDisconnect}
                    className="w-full"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Disconnect
                  </Button>
                </div>
              ) : (
                <Button 
                  variant="default" 
                  size="lg" 
                  onClick={() => {
                    setIsWalletModalOpen(true);
                    setIsMobileMenuOpen(false);
                  }}
                  className="mt-4"
                >
                  <Wallet className="h-4 w-4 mr-2" />
                  Connect Wallet
                </Button>
              )}
            </nav>
          </motion.div>
        )}
      </motion.header>

      {/* Wallet Connection Modal */}
      <WalletModal 
        open={isWalletModalOpen} 
        onOpenChange={setIsWalletModalOpen}
      />
    </>
  );
};

export default Header;
