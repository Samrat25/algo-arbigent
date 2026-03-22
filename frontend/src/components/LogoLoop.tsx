import React from 'react';
import { motion } from 'framer-motion';

export interface Logo {
  node?: React.ReactNode;
  src?: string;
  alt?: string;
  title?: string;
  href?: string;
}

export interface LogoLoopProps {
  logos: Logo[];
  speed?: number;
  direction?: 'left' | 'right';
  logoHeight?: number;
  gap?: number;
  hoverSpeed?: number;
  scaleOnHover?: boolean;
  fadeOut?: boolean;
  fadeOutColor?: string;
  ariaLabel?: string;
  useCustomRender?: boolean;
}

const LogoLoop: React.FC<LogoLoopProps> = ({
  logos,
  speed = 100,
  direction = 'left',
  logoHeight = 60,
  gap = 60,
  hoverSpeed = 0,
  scaleOnHover = false,
  fadeOut = false,
  fadeOutColor = "transparent",
  ariaLabel,
  useCustomRender = false
}) => {
  // Speed is inversely proportional to duration (e.g., speed=100 -> ~10s)
  const duration = Math.max(1, 2000 / speed);

  return (
    <div 
      className="relative flex overflow-hidden w-full group"
      aria-label={ariaLabel}
      style={{ padding: `${gap / 2}px 0` }}
    >
      {fadeOut && (
        <>
          <div className="absolute left-0 top-0 bottom-0 w-32 z-10 pointer-events-none" 
               style={{ background: `linear-gradient(to right, ${fadeOutColor}, transparent)` }} />
          <div className="absolute right-0 top-0 bottom-0 w-32 z-10 pointer-events-none" 
               style={{ background: `linear-gradient(to left, ${fadeOutColor}, transparent)` }} />
        </>
      )}

      {/* Render two sets of the loop for infinite scrolling */}
      {[0, 1].map((index) => (
        <motion.div
          key={index}
          className="flex whitespace-nowrap flex-shrink-0 items-center justify-around"
          initial={{ x: direction === 'left' ? 0 : '-100%' }}
          animate={{ x: direction === 'left' ? '-100%' : 0 }}
          transition={{
            repeat: Infinity,
            ease: "linear",
            duration: duration,
          }}
          style={{ gap: `${gap}px`, paddingRight: `${gap}px`, minWidth: '100%' }}
        >
          {logos.map((logo, i) => (
            <div
              key={`${index}-${i}`}
              className={`flex items-center justify-center transition-all duration-300 ${
                scaleOnHover ? 'group-hover:scale-110' : ''
              } ${logo.href ? 'cursor-pointer' : ''}`}
              style={{ height: logoHeight }}
              onClick={() => logo.href && window.open(logo.href, '_blank')}
            >
              {logo.node ? (
                logo.node
              ) : logo.src ? (
                <img 
                  src={logo.src} 
                  alt={logo.alt || logo.title} 
                  style={{ height: '100%', objectFit: 'contain' }} 
                  className="max-w-[200px]" 
                />
              ) : (
                <span className="text-2xl md:text-3xl font-hero tracking-widest text-foreground/40 hover:text-foreground/80 transition-colors uppercase font-bold">
                  {logo.title}
                </span>
              )}
            </div>
          ))}
        </motion.div>
      ))}
    </div>
  );
};

export default LogoLoop;
