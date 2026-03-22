import React, { useRef, useEffect } from 'react';

interface DarkVeilProps {
  hueShift?: number;
  noiseIntensity?: number;
  scanlineIntensity?: number;
  speed?: number;
  scanlineFrequency?: number;
  warpAmount?: number;
}

const DarkVeil: React.FC<DarkVeilProps> = ({
  hueShift = 0,
  noiseIntensity = 0,
  scanlineIntensity = 0,
  speed = 0.3,
  scanlineFrequency = 0,
  warpAmount = 0,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    let time = 0;
    let animationFrameId: number;
    
    const resizeCanvas = () => {
      const parent = canvas.parentElement;
      if (parent) {
        canvas.width = parent.clientWidth;
        canvas.height = parent.clientHeight;
      }
    };
    
    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();

    const draw = () => {
      time += speed * 0.05;
      
      const w = canvas.width;
      const h = canvas.height;
      
      // Clear canvas with a very dark background
      ctx.fillStyle = `hsl(${260 + hueShift}, 40%, 6%)`;
      ctx.fillRect(0, 0, w, h);
      
      // Draw smooth warped glowing orbs representing the "Veil"
      for(let i = 0; i < 3; i++) {
        const cx = w * (0.3 + 0.4 * Math.sin(time * 0.5 + i * 2.1));
        const cy = h * (0.4 + 0.3 * Math.cos(time * 0.4 + i * 1.5));
        
        // Add warp effect
        const warpedX = cx + Math.sin(time + cy * 0.01) * warpAmount * 100;
        
        const gradient = ctx.createRadialGradient(warpedX, cy, 0, warpedX, cy, w * 0.5);
        gradient.addColorStop(0, `hsla(${270 + hueShift}, 80%, 40%, 0.15)`);
        gradient.addColorStop(1, 'transparent');
        
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, w, h);
      }
      
      // Scanlines
      if (scanlineIntensity > 0 && scanlineFrequency > 0) {
        ctx.fillStyle = `rgba(0, 0, 0, ${scanlineIntensity * 0.1})`;
        for(let y = 0; y < h; y += 10 / scanlineFrequency) {
          ctx.fillRect(0, y, w, 1);
        }
      }
      
      // Noise
      if (noiseIntensity > 0) {
        // Implement lightweight static noise
        const imageData = ctx.getImageData(0, 0, w, h);
        const data = imageData.data;
        for (let i = 0; i < data.length; i += 4) {
          const noise = (Math.random() - 0.5) * noiseIntensity * 50;
          data[i] += noise;
          data[i+1] += noise;
          data[i+2] += noise;
        }
        ctx.putImageData(imageData, 0, 0);
      }
      
      animationFrameId = requestAnimationFrame(draw);
    };
    
    draw();
    
    return () => {
      window.removeEventListener('resize', resizeCanvas);
      cancelAnimationFrame(animationFrameId);
    };
  }, [hueShift, noiseIntensity, scanlineIntensity, speed, scanlineFrequency, warpAmount]);

  return (
    <canvas 
      ref={canvasRef} 
      style={{
        display: 'block',
        width: '100%',
        height: '100%',
        position: 'absolute',
        top: 0,
        left: 0,
        pointerEvents: 'none'
      }} 
    />
  );
};

export default DarkVeil;
