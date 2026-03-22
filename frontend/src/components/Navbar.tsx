import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAlgorandWallet } from "@/contexts/AlgorandWalletContext";
import { WalletModal } from "@/components/WalletModal";
import { Wallet, LogOut, LayoutDashboard } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const landingLinks = [
  { name: "Home", href: "/" },
  { name: "API", href: "/api-endpoints" },
  { name: "Pricing", href: "/pricing" },
  { name: "FAQ", href: "/faq" }
];

const dashboardLinks = [
  { name: "Dashboard", href: "/dashboard" },
  { name: "Vault", href: "/vault" },
  { name: "Agents", href: "/agents" },
  { name: "History", href: "/history" }
];

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { connected, account, disconnect, balances, wallet } = useAlgorandWallet();

  const isProtectedRoute = location.pathname === '/dashboard' || 
                          location.pathname === '/vault' || 
                          location.pathname === '/agents' ||
                          location.pathname === '/history';

  const navLinks = isProtectedRoute ? dashboardLinks : landingLinks;

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

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav 
      className={`fixed top-0 left-1/2 z-50 w-[95%] rounded-full transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] ${
        isScrolled 
          ? "translate-y-4 max-w-[540px] -translate-x-1/2 bg-black/80 backdrop-blur-xl border border-primary/50 shadow-[0_0_30px_rgba(255,138,0,0.2)]" 
          : "translate-y-6 max-w-5xl -translate-x-1/2 bg-black border border-primary shadow-[0_0_25px_rgba(255,138,0,0.6)]"
      }`}
    >
      <div className={`flex items-center justify-between transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] ${isScrolled ? "px-6 py-2" : "px-6 py-3"}`}>
        <Link to="/" className="flex items-center gap-2 group transition-opacity hover:opacity-80">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-black font-bold text-lg shadow-[0_0_15px_rgba(255,138,0,0.5)] transition-transform group-hover:scale-105">
            A
          </div>
          <span className={`text-xl font-hero font-bold text-foreground tracking-tight transition-all duration-500 ${isScrolled ? "hidden sm:inline-block" : "inline-block"}`}>ArbiGent</span>
        </Link>

        <div className={`hidden md:flex items-center gap-1 overflow-hidden transition-all duration-500 ${isScrolled ? "max-w-0 opacity-0 pointer-events-none" : "max-w-[400px] opacity-100"}`}>
          {navLinks.map((link) => {
            const isActive = link.href === location.pathname || (link.name === "Home" && location.pathname === "/");
            const isAnchor = link.href.includes('#');

            return isAnchor ? (
              <a
                key={link.name}
                href={link.name === "Home" ? "/" : link.href}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 whitespace-nowrap ${
                  isActive
                    ? "bg-secondary/80 text-foreground shadow-inner"
                    : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                }`}
              >
                {isActive && (
                 <span className="inline-block w-1.5 h-1.5 rounded-full bg-primary mr-2 shadow-[0_0_8px_rgba(var(--primary),0.8)]" />
                )}
                {link.name}
              </a>
            ) : (
              <Link
                key={link.name}
                to={link.href}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 whitespace-nowrap ${
                  isActive
                    ? "bg-secondary/80 text-foreground shadow-inner"
                    : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                }`}
              >
                {isActive && (
                 <span className="inline-block w-1.5 h-1.5 rounded-full bg-primary mr-2 shadow-[0_0_8px_rgba(var(--primary),0.8)]" />
                )}
                {link.name}
              </Link>
            );
          })}
        </div>
        <div className="flex items-center gap-2">
          {connected && account?.address ? (
            <>
              {location.pathname !== '/dashboard' && (
                <Link to="/dashboard" className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold transition-all duration-300 text-muted-foreground hover:text-foreground hover:bg-white/5">
                  <LayoutDashboard className="w-3.5 h-3.5" />
                  <span className={isScrolled ? "hidden lg:inline" : "inline"}>DASHBOARD</span>
                </Link>
              )}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="hero" size="default" className="inline-flex gap-2 rounded-full h-10 px-4">
                    <Wallet className="h-4 w-4" />
                    <span className="hidden sm:inline">{truncateAddress(account.address)}</span>
                    <span className="sm:hidden">{account.address.slice(0, 4)}...</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-64 bg-black border-primary/50 text-white backdrop-blur-xl">
                  <DropdownMenuLabel>
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium">Connected Wallet</p>
                      <p className="text-xs text-muted-foreground">{wallet?.name || 'Algorand Wallet'}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator className="bg-white/10" />
                  <div className="px-2 py-2 space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">ALGO:</span>
                      <span className="font-medium text-primary">{balances.ALGO}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">USDC:</span>
                      <span className="font-medium text-primary">{balances.USDC}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">USDT:</span>
                      <span className="font-medium text-primary">{balances.USDT}</span>
                    </div>
                  </div>
                  <DropdownMenuSeparator className="bg-white/10" />
                  <DropdownMenuItem onClick={handleDisconnect} className="text-destructive focus:bg-destructive/10 focus:text-destructive cursor-pointer">
                    <LogOut className="h-4 w-4 mr-2" />
                    Disconnect
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <Button 
              variant="hero" 
              size="default" 
              className="hidden md:inline-flex"
              onClick={() => setIsWalletModalOpen(true)}
            >
              Connect Wallet
            </Button>
          )}
        </div>
      </div>
      
      <WalletModal 
        open={isWalletModalOpen} 
        onOpenChange={setIsWalletModalOpen}
      />
    </nav>
  );
};

export default Navbar;
