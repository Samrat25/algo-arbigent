import { useState } from "react";
import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import PriceChart from "@/components/PriceChart";
import LogoLoop from "@/components/LogoLoop";
import ShapeGrid from "@/components/ShapeGrid";
import PremiumCard from "@/components/PremiumCard";
import HowItWorks from "@/components/HowItWorks";
import { Activity, Zap, LineChart, Globe, Shield, Layers, TrendingUp } from "lucide-react";
import { motion } from "framer-motion";
import { useAlgorandWallet } from "@/contexts/AlgorandWalletContext";

const features = [
  {
    title: "Real-Time Tracking",
    description: "Scan thousands of liquidity pools across multiple chains with zero latency.",
    icon: Activity
  },
  {
    title: "Smart Execution",
    description: "Multi-layered logic ensures profitable trades before executing.",
    icon: Zap
  },
  {
    title: "Predictive Analytics",
    description: "Anticipate market movements and impermanent loss using advanced ML.",
    icon: LineChart
  },
  {
    title: "Cross-Chain Flow",
    description: "Bridge assets instantaneously via Aptos, Algorand, and Solana.",
    icon: Globe
  },
  {
    title: "Secure Enclaves",
    description: "Vault integration with military-grade encryption for all stored keys.",
    icon: Shield
  },
  {
    title: "DeFi Abstraction",
    description: "Interact with complex protocols through a completely unified interface.",
    icon: Layers
  }
];

const Index = () => {
  const { connected } = useAlgorandWallet();

  return (
    <div className="min-h-screen bg-background text-foreground dark">
      <Navbar />
      <HeroSection />
      
      {/* Connected Wallets */}
      <section className="py-8 border-y border-white/5 relative z-10 bg-background/60 backdrop-blur-xl">
        <div className="container mx-auto px-6 mb-6">
          <p className="text-center text-xs font-semibold text-primary uppercase tracking-[0.3em] font-mono">Connected Wallets</p>
        </div>
        
        <div className="relative w-full">
          <LogoLoop
            logos={[
              { title: "PERA" },
              { title: "LUTE" },
              { title: "DEFLY" },
              { title: "ALGORAND" },
              { title: "SORA" },
              { title: "PERA" },
              { title: "LUTE" }
            ]}
            speed={40}
            direction="left"
            logoHeight={40}
            gap={100}
            scaleOnHover
            fadeOut
            fadeOutColor="var(--background)"
            ariaLabel="Connected Wallets"
          />
        </div>
      </section>

      {/* Feature Cards Section */}
      <section className="py-24 relative overflow-hidden">
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

        <div className="container mx-auto px-6 relative z-10">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-5xl font-hero tracking-tight text-foreground mb-4">Unmatched Capability</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Equipped with enterprise-grade infrastructure to dominate the decentralized markets.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {features.map((feature, index) => (
              <PremiumCard 
                key={index}
                delay={0.1 * index}
                className="hover:shadow-[0_20px_40px_-15px_rgba(var(--primary),0.4)]"
              >
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-6 group-hover:bg-primary/20 transition-colors">
                  <feature.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-xl font-bold mb-3 text-foreground tracking-tight">{feature.title}</h3>
                <p className="text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </PremiumCard>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Timeline */}
      <HowItWorks />
      
      {/* Footer */}
      <footer className="py-12 border-t border-white/5 relative z-10 bg-background">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-black font-bold shadow-[0_0_15px_rgba(255,138,0,0.5)]">
                A
              </div>
              <span className="font-hero text-xl font-bold tracking-tight text-foreground">ArbiGent</span>
            </div>
            
            <p className="text-sm text-muted-foreground">
              © 2025 ArbiGent. Built on Algorand. All rights reserved.
            </p>
            
            <div className="flex items-center gap-6">
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors text-sm uppercase tracking-widest font-bold">Twitter</a>
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors text-sm uppercase tracking-widest font-bold">Discord</a>
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors text-sm uppercase tracking-widest font-bold">Docs</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
