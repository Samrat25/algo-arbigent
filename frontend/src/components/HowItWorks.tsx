import React, { useRef } from "react";
import { motion, useScroll } from "framer-motion";
import { Wallet, Search, Zap, CheckCircle2 } from "lucide-react";
import ShapeGrid from "@/components/ShapeGrid";

const timelineSteps = [
  {
    title: "Connect & Fund",
    description: "Link your wallet and deposit initial capital securely into the smart contract vault.",
    icon: Wallet,
  },
  {
    title: "AI Analysis",
    description: "Our agent continuously scans thousands of Cross-Chain liquidity pools in real-time.",
    icon: Search,
  },
  {
    title: "Smart Execution",
    description: "Profitable routes are detected and transactions are bundled to eliminate slippage.",
    icon: Zap,
  },
  {
    title: "Profit Realized",
    description: "Arbitrage gains are settled directly back into your vault balance automatically.",
    icon: CheckCircle2,
  },
];

const HowItWorks = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Track scroll for the vertical line only
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start 70%", "end end"], // Guarantees 1.0 when bottom of container hits bottom of screen
  });

  return (
    <section className="py-24 relative overflow-hidden">
      {/* ShapeGrid Background matching the rest of the page */}
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
      <div className="absolute top-1/4 right-1/3 w-[500px] h-[500px] rounded-full bg-primary/8 blur-[120px] pointer-events-none z-0" />
      <div className="absolute bottom-0 left-1/4 w-[400px] h-[400px] rounded-full bg-primary/5 blur-[100px] pointer-events-none z-0" />

      <div className="container mx-auto px-6 max-w-5xl relative z-10">
        <div className="text-center mb-20">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl md:text-5xl font-hero tracking-tight text-foreground mb-4"
          >
            How ArbiGent Works
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-muted-foreground text-lg max-w-2xl mx-auto"
          >
            A fully autonomous lifecycle from scanning to settlement.
          </motion.p>
        </div>

        <div ref={containerRef} className="relative pb-10">
          {/* Timeline Track Line (Background) */}
          <div className="absolute left-[39px] md:left-1/2 md:-translate-x-px top-8 bottom-8 w-[2px] bg-white/10" />

          {/* Timeline Fill Line (Animated) */}
          <motion.div 
            className="absolute left-[39px] md:left-1/2 md:-translate-x-px top-8 bottom-8 w-[2px] bg-gradient-to-b from-primary via-orange-400 to-primary origin-top glow-md"
            style={{ 
              scaleY: scrollYProgress,
              transformStyle: "preserve-3d" // hardware acceleration
            }}
          />

          <div className="space-y-24 relative">
            {timelineSteps.map((step, index) => {
              const isEven = index % 2 === 0;

              return (
                <div key={index} className="relative flex items-center md:justify-center">
                  
                  {/* Left Content (md+) */}
                  <div className={`hidden md:block w-1/2 pr-16 text-right ${!isEven ? 'opacity-0' : ''}`}>
                    {isEven && (
                      <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true, margin: "-100px" }}
                        transition={{ duration: 0.5, delay: 0.1 }}
                      >
                        <h3 className="text-2xl font-bold text-foreground mb-2">{step.title}</h3>
                        <p className="text-muted-foreground">{step.description}</p>
                      </motion.div>
                    )}
                  </div>

                  {/* Center Node */}
                  <div className="relative z-10 flex h-20 w-20 shrink-0 items-center justify-center rounded-full border-4 border-background bg-slate-900 shadow-xl ml-0 md:mx-auto">
                    <motion.div
                      className="absolute inset-0 rounded-full border-2 border-primary"
                      initial={{ scale: 0.8, opacity: 0, boxShadow: "0 0 0px rgba(255,138,0,0)" }}
                      whileInView={{ scale: 1, opacity: 1, boxShadow: "0 0 20px rgba(255,138,0,0.4)" }}
                      viewport={{ once: true, margin: "-100px" }}
                      transition={{ duration: 0.5 }}
                    />
                    <step.icon className="h-8 w-8 text-primary" />
                  </div>

                  {/* Right Content */}
                  <div className={`w-full md:w-1/2 pl-8 md:pl-16 ${isEven ? 'md:opacity-0' : ''}`}>
                    <motion.div
                      className={isEven ? "md:hidden" : ""}
                      initial={{ opacity: 0, x: 20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true, margin: "-100px" }}
                      transition={{ duration: 0.5, delay: 0.1 }}
                    >
                      <h3 className="text-2xl font-bold text-foreground mb-2">{step.title}</h3>
                      <p className="text-muted-foreground">{step.description}</p>
                    </motion.div>
                  </div>

                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
