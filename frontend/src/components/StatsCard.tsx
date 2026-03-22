import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";
import AnimatedValue from "./AnimatedValue";
import ValueChangeIndicator from "./ValueChangeIndicator";

interface StatsCardProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  subValue?: string;
  trend?: {
    value: string;
    isPositive: boolean;
  };
  delay?: number;
  isLoading?: boolean;
  isAnimated?: boolean;
  previousValue?: number;
  showChangeIndicator?: boolean;
  isUpdating?: boolean;
}

import { useRef, useState } from "react";

const StatsCard = ({ 
  icon: Icon, 
  label, 
  value, 
  subValue, 
  trend, 
  delay = 0, 
  isLoading = false,
  isAnimated = false,
  previousValue,
  showChangeIndicator = false,
  isUpdating = false
}: StatsCardProps) => {
  const divRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [opacity, setOpacity] = useState(0);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!divRef.current) return;
    const div = divRef.current;
    const rect = div.getBoundingClientRect();
    setPosition({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  return (
    <motion.div
      ref={divRef}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      whileHover={{ y: -5, scale: 1.02 }}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setOpacity(1)}
      onMouseLeave={() => setOpacity(0)}
      className="rounded-xl border border-primary bg-black/60 backdrop-blur-xl p-5 shadow-[0_0_15px_rgba(255,138,0,0.2)] hover:shadow-[0_0_25px_rgba(255,138,0,0.5)] transition-all duration-500 relative overflow-hidden group"
    >
      <div
        className="pointer-events-none absolute -inset-px opacity-0 transition duration-300"
        style={{
          opacity,
          background: `radial-gradient(400px circle at ${position.x}px ${position.y}px, rgba(255,138,0,0.1), transparent 40%)`,
        }}
      />
      {/* Loading shimmer effect */}
      {isLoading && (
        <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/5 to-transparent" />
      )}
      
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm text-muted-foreground">{label}</span>
        <div className="flex items-center gap-2">
          {isUpdating && !isLoading && (
            <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
          )}
          <Icon className={`h-5 w-5 transition-colors ${isLoading ? 'text-muted-foreground/50' : 'text-muted-foreground'}`} />
        </div>
      </div>
      
      <div className="flex items-end justify-between">
        <div>
          {isLoading ? (
            <div className="space-y-2">
              <div className="h-8 bg-muted/50 rounded animate-pulse w-24" />
              {subValue && <div className="h-4 bg-muted/30 rounded animate-pulse w-32" />}
            </div>
          ) : (
            <>
              <p className="font-mono text-2xl font-bold text-foreground flex items-center gap-2">
                {isAnimated && typeof value === 'number' ? (
                  <AnimatedValue 
                    value={Math.abs(value)} 
                    prefix={value >= 0 ? '+$' : '-$'} 
                    decimals={2}
                    className="inline-block"
                  />
                ) : (
                  value
                )}
                {showChangeIndicator && typeof value === 'number' && (
                  <ValueChangeIndicator 
                    currentValue={value} 
                    previousValue={previousValue}
                    showIndicator={!isLoading}
                  />
                )}
              </p>
              {subValue && (
                <p className="text-sm text-muted-foreground mt-1">{subValue}</p>
              )}
            </>
          )}
        </div>
        
        {trend && !isLoading && (
          <div className={`flex items-center gap-1 rounded-full px-2 py-1 text-xs font-mono ${
            trend.isPositive ? "bg-success/20 text-success" : "bg-destructive/20 text-destructive"
          }`}>
            {trend.isPositive ? "↑" : "↓"} {trend.value}
          </div>
        )}
        
        {isLoading && (
          <div className="h-6 bg-muted/30 rounded-full animate-pulse w-16" />
        )}
      </div>
    </motion.div>
  );
};

export default StatsCard;
