import Navbar from "@/components/Navbar";
import ShapeGrid from "@/components/ShapeGrid";
import { Plus, Minus } from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const faqs = [
  {
    question: "What exactly is ArbiGent?",
    answer: "ArbiGent is a fully autonomous, cross-chain cryptocurrency arbitrage engine. By utilizing our proprietary Machine Learning models, ArbiGent actively tracks and exploits fractional price differences of assets (like APT, SOL, and USDC) across isolated liquidity pools."
  },
  {
    question: "How does the Zero-Latency system work?",
    answer: "Instead of routing trades through traditional slow REST APIs, ArbiGent places dedicated RPC nodes positioned geographically as close as physically possible to the blockchain validators. This allows us to spot and front-run market discrepancies instantly."
  },
  {
    question: "Are my funds actually kept safe?",
    answer: "Absolutely. ArbiGent operates using 'Secure Enclaves'—hardware isolated vaults equipped with military-grade encryption. We never possess withdrawal capabilities without your cryptographic two-factor signature."
  },
  {
    question: "Why should I upgrade to Pro or Enterprise?",
    answer: "While the Developer tier grants access to standard liquidity tracking, the Pro and Enterprise models unlock our advanced ML Predictions algorithms, prioritize your executions ahead of other traders, and give you infinite API bandwidth."
  },
  {
    question: "What networks are currently supported?",
    answer: "We dominantly support testnet and mainnet operations across Algorand (ALGO), Aptos (APT), and Solana (SOL). Deep DeFi Abstraction is currently in beta for extending Ethereum rollup integration natively."
  }
];

const FAQ = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

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

      <div className="container mx-auto px-6 py-32 relative z-10 flex-1 flex flex-col justify-center items-center">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16 max-w-2xl"
        >
          <h1 className="text-4xl md:text-6xl font-hero font-bold mb-6 tracking-tight">
            Frequently Asked <span className="text-primary glow-text">Questions</span>
          </h1>
          <p className="text-muted-foreground text-lg">
            Everything you need to know about ArbiGent's pricing, security architecture, and cross-chain execution capabilities.
          </p>
        </motion.div>

        <div className="w-full max-w-3xl space-y-4">
          {faqs.map((faq, index) => {
            const isOpen = openIndex === index;

            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                className={`border rounded-2xl bg-black overflow-hidden transition-all duration-500 ${
                  isOpen ? "border-primary shadow-[0_0_20px_rgba(255,138,0,0.3)]" : "border-white/10 hover:border-primary/50"
                }`}
              >
                <button
                  onClick={() => setOpenIndex(isOpen ? null : index)}
                  className="w-full flex items-center justify-between p-6 text-left"
                >
                  <span className={`font-bold text-lg md:text-xl transition-colors ${isOpen ? "text-primary" : "text-white"}`}>
                    {faq.question}
                  </span>
                  <span className={`ml-4 shrink-0 transition-transform duration-300 ${isOpen ? "text-primary rotate-180" : "text-muted-foreground"}`}>
                    {isOpen ? <Minus className="w-6 h-6" /> : <Plus className="w-6 h-6" />}
                  </span>
                </button>

                <AnimatePresence>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: "easeInOut" }}
                    >
                      <div className="p-6 pt-0 text-muted-foreground leading-relaxed">
                        {faq.answer}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default FAQ;
