import React, { useRef, useState } from "react";
import { motion } from "framer-motion";

interface PremiumCardProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}

const PremiumCard: React.FC<PremiumCardProps> = ({ children, className = "", delay = 0 }) => {
  const divRef = useRef<HTMLDivElement>(null);
  const [isFocused, setIsFocused] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [opacity, setOpacity] = useState(0);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!divRef.current || isFocused) return;

    const div = divRef.current;
    const rect = div.getBoundingClientRect();

    setPosition({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  const handleFocus = () => {
    setIsFocused(true);
    setOpacity(1);
  };

  const handleBlur = () => {
    setIsFocused(false);
    setOpacity(0);
  };

  const handleMouseEnter = () => {
    setOpacity(1);
  };

  const handleMouseLeave = () => {
    setOpacity(0);
  };

  return (
    <motion.div
      ref={divRef}
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.6, delay: delay, ease: [0.25, 0.4, 0.25, 1] }}
      onMouseMove={handleMouseMove}
      onFocus={handleFocus}
      onBlur={handleBlur}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      whileHover={{ y: -8, scale: 1.02 }}
      className={`relative overflow-hidden rounded-2xl bg-black border border-primary shadow-[0_0_15px_rgba(255,138,0,0.3)] hover:shadow-[0_0_30px_rgba(255,138,0,0.6)] p-8 transition-all duration-500 group ${className}`}
    >
      <div
        className="pointer-events-none absolute -inset-px opacity-0 transition duration-300"
        style={{
          opacity,
          background: `radial-gradient(600px circle at ${position.x}px ${position.y}px, rgba(255,138,0,.15), transparent 40%)`,
        }}
      />
      
      {/* Subtle top border glow that follows mouse */}
      <div 
        className="pointer-events-none absolute inset-0 rounded-2xl transition duration-300"
        style={{
           opacity,
           background: `radial-gradient(400px circle at ${position.x}px 0px, rgba(255,255,255,.1), transparent 40%)`,
        }}
      />

      {/* Content wrapper to raise z-index over the spotlight */}
      <div className="relative z-10">
        {children}
      </div>
    </motion.div>
  );
};

export default PremiumCard;
