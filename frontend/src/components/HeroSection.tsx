import { Button } from "@/components/ui/button";
import { ArrowRight, LayoutDashboard, Radio } from "lucide-react";
import PriceChart from "./PriceChart";
import ShapeGrid from "@/components/ShapeGrid";
import { useState } from "react";
import { useAlgorandWallet } from "@/contexts/AlgorandWalletContext";
import { WalletModal } from "./WalletModal";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

const HeroSection = () => {
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);
  const { connected } = useAlgorandWallet();
  const navigate = useNavigate();

  const handleCtaClick = () => {
    if (connected) {
      navigate('/dashboard');
    } else {
      setIsWalletModalOpen(true);
    }
  };

  return (
    <section className="relative min-h-screen flex items-center overflow-hidden">
      {/* ShapeGrid Background */}
      <div className="absolute inset-0 z-0 opacity-40">
        <ShapeGrid 
          speed={0}
          squareSize={77}
          direction="diagonal"
          borderColor="#271E37"
          hoverFillColor="#222222"
          shape="square"
          hoverTrailAmount={0}
        />
      </div>
      
      {/* Purple glow orbs */}
      <div className="absolute top-1/4 left-1/3 w-[500px] h-[500px] rounded-full bg-primary/8 blur-[120px] pointer-events-none z-0" />
      <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] rounded-full bg-primary/5 blur-[100px] pointer-events-none z-0" />

      <div className="container mx-auto px-6 pt-28 pb-16 relative z-10">
        <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-8">
          {/* Left content */}
          <div className="flex-1 max-w-xl pt-16">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 mb-6">
                <Radio className="h-3 w-3 text-primary animate-pulse" />
                <span className="text-sm font-hero font-bold text-primary">CURRENTLY ON ALGORAND TESTNET</span>
              </div>
              
              <h1 className="font-hero text-5xl md:text-6xl lg:text-7xl leading-[1.05] tracking-tight text-foreground mb-6 text-balance">
                AGENTIC <span className="text-primary">ARBITRAGE</span> PLATFORM
              </h1>

              <p className="text-base md:text-lg text-muted-foreground max-w-md mb-10 leading-relaxed font-medium">
                Execute autonomous arbitrage agents that continuously scan Algorand DEXs, monitor prices, and automatically execute profitable trades via secure smart contracts.
              </p>

              <div className="flex flex-wrap gap-4 mb-16">
                <Button 
                  variant="hero" 
                  size="xl"
                  onClick={handleCtaClick}
                  className="font-hero px-8 py-7 text-lg rounded-2xl shadow-[0_0_20px_rgba(var(--primary),0.3)] transition-all hover:scale-105"
                >
                  {connected ? (
                    <>Go to Command Center <LayoutDashboard className="ml-2 w-5 h-5" /></>
                  ) : (
                    <>Connect Algorand Wallet <ArrowRight className="ml-2 w-5 h-5" /></>
                  )}
                </Button>
                <Button variant="heroOutline" size="xl" className="font-hero px-8 py-7 text-lg rounded-2xl border-white/10 hover:bg-white/5 transition-all">
                  Documentation
                </Button>
              </div>

              {/* Stats */}
              <div className="flex items-center gap-8">
                <div className="flex items-center gap-6">
                  <div>
                    <div className="text-2xl font-bold text-foreground">99.9%</div>
                    <div className="text-xs text-muted-foreground font-hero uppercase tracking-widest font-bold">Uptime</div>
                  </div>
                  <div className="w-px h-8 bg-white/10" />
                  <div>
                    <div className="text-2xl font-bold text-foreground">40k+</div>
                    <div className="text-xs text-muted-foreground font-hero uppercase tracking-widest font-bold">Trades Daily</div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Right Price Chart */}
          <div className="flex-1 flex justify-center lg:justify-end w-full">
            <div className="w-full max-w-2xl bg-black/40 backdrop-blur-xl rounded-3xl border border-white/10 p-2 shadow-2xl overflow-hidden">
               <PriceChart />
            </div>
          </div>
        </div>
      </div>
      
      <WalletModal 
        open={isWalletModalOpen} 
        onOpenChange={setIsWalletModalOpen}
      />
    </section>
  );
};

export default HeroSection;
