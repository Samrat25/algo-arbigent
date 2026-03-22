import Navbar from "@/components/Navbar";
import ShapeGrid from "@/components/ShapeGrid";
import { Check, X, Shield, Zap, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

const pricingTiers = [
  {
    name: "Developer",
    price: "₹0",
    duration: "/ month",
    description: "Perfect for testing and sandbox environments.",
    icon: Shield,
    features: [
      { name: "Basic API Access", included: true },
      { name: "Standard Liquidity Tracking", included: true },
      { name: "100 Requests / Minute", included: true },
      { name: "Community Support", included: true },
      { name: "Advanced ML Predictions", included: false },
      { name: "Priority Execution", included: false },
      { name: "Dedicated Nodes", included: false },
    ],
    buttonText: "Start Building",
    isPopular: false,
  },
  {
    name: "Pro Trader",
    price: "₹4,999",
    duration: "/ month",
    description: "For serious arbitrageurs commanding high volume.",
    icon: Zap,
    features: [
      { name: "Full API Access", included: true },
      { name: "Unlimited Liquidity Tracking", included: true },
      { name: "10,000 Requests / Minute", included: true },
      { name: "Standard Support", included: true },
      { name: "Advanced ML Predictions", included: true },
      { name: "Priority Execution", included: true },
      { name: "Dedicated Nodes", included: false },
    ],
    buttonText: "Upgrade to Pro",
    isPopular: true,
  },
  {
    name: "Enterprise",
    price: "₹24,999",
    duration: "/ month",
    description: "Maximum zero-latency power for institutions.",
    icon: Sparkles,
    features: [
      { name: "Unrestricted API Access", included: true },
      { name: "Custom Cross-Chain Routing", included: true },
      { name: "Unlimited Requests", included: true },
      { name: "24/7 Priority Support", included: true },
      { name: "Advanced ML Predictions", included: true },
      { name: "VIP Priority Execution", included: true },
      { name: "Dedicated Custom Nodes", included: true },
    ],
    buttonText: "Contact Sales",
    isPopular: false,
  }
];

const Pricing = () => {
  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary/30 relative dark flex flex-col">
      <Navbar />

      {/* Global Background */}
      <div className="fixed inset-0 z-0 opacity-40 pointer-events-none">
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

      <div className="container mx-auto px-6 py-32 relative z-10 flex-1 flex flex-col justify-center">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-hero font-bold mb-6 tracking-tight">
            Transparent Pricing. <span className="text-primary glow-text">Infinite Power.</span>
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Choose the deployment tier that matches your trading volume. Cancel anytime. Zero hidden fees.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto w-full">
          {pricingTiers.map((tier, index) => (
            <motion.div
              key={tier.name}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.15 }}
              className={`relative flex flex-col p-8 rounded-3xl bg-black border transition-all duration-500 group ${
                tier.isPopular 
                  ? "border-primary shadow-[0_0_25px_rgba(255,138,0,0.5)] hover:shadow-[0_0_40px_rgba(255,138,0,0.7)] scale-100 md:scale-105 z-10" 
                  : "border-white/10 hover:border-primary/50 hover:shadow-[0_0_20px_rgba(255,138,0,0.3)] opacity-90 hover:opacity-100"
              }`}
            >
              {tier.isPopular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-primary text-black font-bold text-xs px-4 py-1.5 rounded-full uppercase tracking-wider shadow-[0_0_15px_rgba(255,138,0,0.8)]">
                  Most Selected
                </div>
              )}

              <div className="mb-8">
                <tier.icon className={`w-10 h-10 mb-4 ${tier.isPopular ? "text-primary" : "text-muted-foreground"}`} />
                <h3 className="text-2xl font-bold text-white mb-2">{tier.name}</h3>
                <p className="text-sm text-muted-foreground min-h-[40px]">{tier.description}</p>
              </div>

              <div className="mb-8 flex items-baseline gap-1">
                <span className="text-5xl font-hero font-bold tracking-tighter text-white">{tier.price}</span>
                <span className="text-muted-foreground font-medium">{tier.duration}</span>
              </div>

              <div className="flex-1 space-y-4 mb-8">
                {tier.features.map((feature, fIndex) => (
                  <div key={fIndex} className="flex items-center gap-3">
                    {feature.included ? (
                      <Check className="w-5 h-5 text-primary shrink-0" />
                    ) : (
                      <X className="w-5 h-5 text-muted-foreground/30 shrink-0" />
                    )}
                    <span className={`text-sm ${feature.included ? "text-gray-300 font-medium" : "text-muted-foreground/40"}`}>
                      {feature.name}
                    </span>
                  </div>
                ))}
              </div>

              <Button 
                variant={tier.isPopular ? "hero" : "heroOutline"} 
                className="w-full py-6 text-base"
              >
                {tier.buttonText}
              </Button>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Pricing;
