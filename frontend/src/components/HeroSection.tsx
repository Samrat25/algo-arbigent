import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import PriceChart from "./PriceChart";
import ShapeGrid from "@/components/ShapeGrid";

const HeroSection = () => {
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
            <h1
              className="font-hero text-5xl md:text-6xl lg:text-7xl leading-[1.05] tracking-tight text-foreground mb-6 text-balance opacity-0 animate-fade-up"
              style={{ animationDelay: "0.1s" }}
            >
              Gain Clarity Take Control Grow
            </h1>

            <p
              className="text-base md:text-lg text-muted-foreground max-w-md mb-10 leading-relaxed opacity-0 animate-fade-up"
              style={{ animationDelay: "0.2s" }}
            >
              A powerful crypto SaaS platform designed to help you launch,
              manage, and scale digital assets and blockchain-based financial
              tools securely and efficiently.
            </p>

            <div
              className="flex flex-wrap gap-4 mb-16 opacity-0 animate-fade-up"
              style={{ animationDelay: "0.3s" }}
            >
              <Button variant="hero" size="lg">
                Connect Wallet <ArrowRight className="ml-1 w-4 h-4" />
              </Button>
              <Button variant="heroOutline" size="lg">
                Learn More
              </Button>
            </div>

            {/* Stats */}
            <div
              className="flex items-center gap-8 opacity-0 animate-fade-up"
              style={{ animationDelay: "0.45s" }}
            >
              <div className="flex -space-x-2">
                {["🧑‍💼", "👩‍💻", "🧑‍🎨"].map((emoji, i) => (
                  <div
                    key={i}
                    className="w-10 h-10 rounded-full bg-secondary border-2 border-background flex items-center justify-center text-lg"
                  >
                    {emoji}
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-6">
                <div>
                  <div className="text-2xl font-bold text-foreground">99.9%</div>
                  <div className="text-xs text-muted-foreground">Uptime</div>
                </div>
                <div className="w-px h-8 bg-border" />
                <div>
                  <div className="text-2xl font-bold text-foreground">400k+</div>
                  <div className="text-xs text-muted-foreground">Active Users</div>
                </div>
              </div>
            </div>
          </div>

          {/* Right dashboard */}
          <div className="flex-1 flex justify-center lg:justify-end w-full">
            <div className="w-full max-w-2xl">
              <PriceChart />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
