import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import PriceChart from "@/components/PriceChart";
import LogoLoop from "@/components/LogoLoop";
import ShapeGrid from "@/components/ShapeGrid";
import PremiumCard from "@/components/PremiumCard";
import HowItWorks from "@/components/HowItWorks";
import { Activity, Zap, LineChart, Globe, Shield, Layers } from "lucide-react";
import { motion } from "framer-motion";

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
  return (
    <div className="min-h-screen bg-background text-foreground dark">
      <Navbar />
      <HeroSection />
      
      {/* Connected Wallets */}
      <section className="py-8 border-y border-white/5 relative z-10 bg-background/60 backdrop-blur-xl">
        <div className="container mx-auto px-6 mb-6">
          <p className="text-center text-xs font-semibold text-primary uppercase tracking-[0.3em] font-mono">Connected Wallets</p>
        </div>
        
 main
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

        <div className="container relative z-10 mx-auto px-4 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-2 lg:gap-16 items-center">
            {/* Left: Hero Content */}
            <div className="max-w-2xl">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
              >
                <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 mb-6">
                  <Radio className="h-3 w-3 mt-auto text-primary animate-pulse " />
                  <span className="text-sm font-display font-bold text-primary">CURRENTLY ON ALGORAND TESTNET</span>
                </div>
                
                <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl font-bold leading-none tracking-wide mb-6 text-gradient-hero">
                  AGENTIC<br />
                  ARBITRAGE<br />
                  PLATFORM
                </h1>
                
                <p className="text-lg text-muted-foreground leading-relaxed mb-8 max-w-lg">
                  Execute autonomous arbitrage agents that continuously scan Algorand DEXs, monitor prices, simulate execution paths, and automatically execute profitable trades using smart contracts.
                </p>
                
                <div className="flex flex-col sm:flex-row gap-4">
                  <Button variant="hero" size="xl" onClick={handleConnect}>
                    {connected ? 'Launch App' : 'Connect Wallet'}
                    <ArrowRight className="h-5 w-5" />
                  </Button>
                </div>
              </motion.div>
              
              {/* Feature Cards Grid */}
              <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 gap-4">
                {features.map((feature, index) => (
                  <FeatureCard
                    key={feature.title}
                    {...feature}
                    delay={0.2 + index * 0.1}
                  />
                ))}
              </div>
            </div>
            
            {/* Right: Price Chart */}
            <div className="lg:pl-8">
              <PriceChart />
              
              {/* Additional Info Cards */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="mt-6 grid grid-cols-2 gap-4"
              >
                <div className="rounded-xl border border-border bg-background/50 backdrop-blur-sm p-4">
                  <p className="text-xs text-muted-foreground mb-1 font-display">Active Arbitrage Routes</p>
                  <p className="font-mono text-xl font-bold text-foreground">47</p>
                  <p className="text-xs text-success mt-1">+12 new today</p>
                </div>
                <div className="rounded-xl border border-border bg-background/50 backdrop-blur-sm p-4">
                  <p className="text-xs text-muted-foreground mb-1 font-display">Total Value Locked</p>
                  <p className="font-mono text-xl font-bold text-foreground">$2.4M</p>
                  <p className="text-xs text-success mt-1">+8.3% this week</p>
                </div>
              </motion.div>
            </div>
          </div>
 main
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
main

      
      {/* CTA Section */}
      <section className="py-20 border-t border-border">
        <div className="container mx-auto px-4 lg:px-8">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="relative overflow-hidden rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/10 via-card to-secondary/10 p-12 text-center"
          >
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary/5 via-transparent to-transparent" />
            
            <div className="relative z-10">
              <h2 className="font-display text-4xl lg:text-5xl font-bold tracking-wide mb-4 text-foreground">
                START TRADING WITH AI
              </h2>
              <p className="text-muted-foreground mb-8 max-w-lg mx-auto">
                Connect your Petra wallet and deploy your first autonomous trading agent in minutes.
              </p>
              <Button variant="glow" size="xl" onClick={handleConnect} className="font-display tracking-wide font-bold">
                {connected ? 'Launch App' : 'Connect Petra Wallet'}
                <ArrowRight className="h-5 w-5" />
              </Button>
              <p className="text-sm text-muted-foreground mt-4">No trading fees for first 30 days</p>
            </div>
          </motion.div>
        </div>
      </section>
      
      {/* Footer */}
      <footer className="py-8 border-t border-border">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              <span className="font-display text-lg font-bold tracking-wide">ARBIGENT</span>
            </div>
            <p className="text-sm text-muted-foreground">
              © 2025 Arbigent. Built on Algorand.
            </p>
          </div>
        </div>
      </footer>
 main

      {/* How It Works Timeline */}
      <HowItWorks />
    </div>
  );
};

export default Index;
