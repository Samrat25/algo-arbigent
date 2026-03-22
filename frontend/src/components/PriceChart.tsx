import { useState, useEffect, useCallback, useRef } from "react";
import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, RefreshCw, ZoomIn, ZoomOut, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ReferenceLine } from "recharts";

interface PriceDataPoint {
  time: number;
  APT: number;
  ALGO: number;
  SOL: number;
}

interface TokenPriceInfo {
  price: number;
  prevPrice: number;
  color: string;
  name: string;
}

type TokenKey = 'APT' | 'ALGO' | 'SOL';

// Coinbase API endpoints
const COINBASE_APT_API = 'https://api.coinbase.com/v2/prices/APT-USD/spot';
const COINBASE_ALGO_API = 'https://api.coinbase.com/v2/prices/ALGO-USD/spot';
const COINBASE_SOL_API = 'https://api.coinbase.com/v2/prices/SOL-USD/spot';

// 5 minute window = 300 seconds, at 3s intervals = 100 max points
const MAX_POINTS = 100;
const REFRESH_INTERVAL = 3000;

// @ts-ignore
const win = window as unknown as any;

// Global state outside the component for persistence across route changes & HMR
win.globalPriceHistory = win.globalPriceHistory || [];
win.globalPrices = win.globalPrices || {
  APT: { price: 0, prevPrice: 0, color: '#ef4444', name: 'APT' },
  ALGO: { price: 0, prevPrice: 0, color: '#3b82f6', name: 'ALGO' },
  SOL: { price: 0, prevPrice: 0, color: '#14f195', name: 'SOL' }
};
win.__chartListeners = win.__chartListeners || new Set<() => void>();

const notifyListeners = () => win.__chartListeners.forEach((l: any) => l());

// Start global polling strictly once, resetting strictly on HMR
if (win.fetchPricesInterval) {
  clearInterval(win.fetchPricesInterval);
}

const fetchPrices = async () => {
  try {
    const [aptResponse, algoResponse, solResponse] = await Promise.all([
      fetch(COINBASE_APT_API).catch(() => null),
      fetch(COINBASE_ALGO_API).catch(() => null),
      fetch(COINBASE_SOL_API).catch(() => null)
    ]);

    let aptPrice = 1.5;
    let algoPrice = 0.2;
    let solPrice = 150.0;

    if (aptResponse && aptResponse.ok) {
      const data = await aptResponse.json();
      aptPrice = parseFloat(data.data?.amount) || 1.5;
    }
    if (algoResponse && algoResponse.ok) {
      const data = await algoResponse.json();
      algoPrice = parseFloat(data.data?.amount) || 0.2;
    }
    if (solResponse && solResponse.ok) {
      const data = await solResponse.json();
      solPrice = parseFloat(data.data?.amount) || 150.0;
    }

    win.globalPrices = {
      APT: { ...win.globalPrices.APT, price: aptPrice, prevPrice: win.globalPrices.APT.price || aptPrice },
      ALGO: { ...win.globalPrices.ALGO, price: algoPrice, prevPrice: win.globalPrices.ALGO.price || algoPrice },
      SOL: { ...win.globalPrices.SOL, price: solPrice, prevPrice: win.globalPrices.SOL.price || solPrice }
    };

    const newPoint: PriceDataPoint = {
      time: Date.now(),
      APT: aptPrice,
      ALGO: algoPrice,
      SOL: solPrice
    };

    const newHistory = [...win.globalPriceHistory, newPoint];
    if (newHistory.length > MAX_POINTS) {
      win.globalPriceHistory = newHistory.slice(-MAX_POINTS);
    } else {
      win.globalPriceHistory = newHistory;
    }

    notifyListeners();
  } catch (err) {
    console.error('Price fetch error:', err);
  }
};

fetchPrices();
win.fetchPricesInterval = setInterval(fetchPrices, REFRESH_INTERVAL);

const PriceChart = () => {
  // Subscribe to the global stores
  const [, setTick] = useState(0);
  const [hoveredPoint, setHoveredPoint] = useState<PriceDataPoint | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [zoomLevel, setZoomLevel] = useState(1);
  const [selectedToken, setSelectedToken] = useState<TokenKey>('APT');
  
  useEffect(() => {
    const listener = () => setTick(t => t + 1);
    win.__chartListeners.add(listener);
    return () => {
      win.__chartListeners.delete(listener);
    };
  }, []);

  const priceHistory = win.globalPriceHistory;
  const prices = win.globalPrices;
  const isLoading = priceHistory.length === 0;

  // Zoom controls
  const handleZoomIn = () => setZoomLevel(prev => Math.min(prev * 1.5, 10));
  const handleZoomOut = () => setZoomLevel(prev => Math.max(prev / 1.5, 0.5));
  const handleResetZoom = () => setZoomLevel(1);

  // Chart dimensions
  const chartWidth = 900;
  const chartHeight = 280;
  const padding = { top: 25, right: 80, bottom: 20, left: 20 };

  // Y-axis: fixed step of 0.0015 per grid cell
  const yAxisStep = 0.0015;
  const numYGridLines = 8;
  const baseYRange = yAxisStep * numYGridLines; // 0.012 total range at 100%
  const zoomedYRange = baseYRange / zoomLevel;
  
  // Center on current price
  const currentPrice = prices[selectedToken]?.price || 1;
  const tokenColor = prices[selectedToken]?.color || '#ef4444';
  const minPrice = currentPrice - zoomedYRange / 2;
  const maxPrice = currentPrice + zoomedYRange / 2;
  const priceRange = maxPrice - minPrice;

  // Dynamic width scaling based on data points
  const dataPoints = priceHistory.length;
  const effectiveWidth = dataPoints > 1 
    ? chartWidth - padding.left - padding.right
    : chartWidth - padding.left - padding.right;

  const scaleX = (index: number) => {
    if (dataPoints <= 1) return padding.left + effectiveWidth / 2;
    return (index / (dataPoints - 1)) * effectiveWidth + padding.left;
  };

  const scaleY = (price: number) => {
    const clampedPrice = Math.max(minPrice, Math.min(maxPrice, price));
    return chartHeight - padding.bottom - ((clampedPrice - minPrice) / priceRange) * (chartHeight - padding.top - padding.bottom);
  };

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const scaleFactorX = chartWidth / rect.width;
    const scaleFactorY = chartHeight / rect.height;
    const x = (e.clientX - rect.left) * scaleFactorX;
    const y = (e.clientY - rect.top) * scaleFactorY;
    setMousePos({ x, y });

    if (dataPoints > 1) {
      const index = Math.round((x - padding.left) / (effectiveWidth / (dataPoints - 1)));
      if (index >= 0 && index < dataPoints) {
        setHoveredPoint(priceHistory[index]);
      }
    }
  };

  const renderGridlines = () => {
    const lines = [];
    
    // Y-axis: use fixed step of 0.0015 (adjusted by zoom)
    const actualYStep = yAxisStep / zoomLevel;
    const startPrice = Math.floor(minPrice / actualYStep) * actualYStep;
    
    for (let price = startPrice; price <= maxPrice + actualYStep; price += actualYStep) {
      const y = scaleY(price);
      if (y >= padding.top && y <= chartHeight - padding.bottom) {
        lines.push(
          <g key={`h-${price.toFixed(6)}`}>
            <line
              x1={padding.left}
              y1={y}
              x2={chartWidth - padding.right}
              y2={y}
              stroke="rgba(148, 163, 184, 0.08)"
              strokeWidth="1"
            />
            <text
              x={chartWidth - padding.right + 8}
              y={y + 4}
              fontSize="10"
              fill="#64748b"
              fontFamily="monospace"
            >
              ${price.toFixed(4)}
            </text>
          </g>
        );
      }
    }

    // X-axis: 5 second intervals
    const xIntervalSec = 5;
    const totalSeconds = dataPoints > 1 ? (dataPoints - 1) * 3 : 0; // 3s per data point
    const numXLines = Math.floor(totalSeconds / xIntervalSec);
    
    for (let i = 0; i <= numXLines; i++) {
      const secondsFromStart = i * xIntervalSec;
      const dataIndex = secondsFromStart / 3; // Convert to data point index
      const x = scaleX(dataIndex);
      
      if (x >= padding.left && x <= chartWidth - padding.right) {
        lines.push(
          <g key={`v-${i}`}>
            <line
              x1={x}
              y1={padding.top}
              x2={x}
              y2={chartHeight - padding.bottom}
              stroke="rgba(148, 163, 184, 0.05)"
              strokeWidth="1"
            />
          </g>
        );
      }
    }

    return lines;
  };

  const renderLine = (dataKey: TokenKey, color: string) => {
    if (dataPoints < 1 || dataKey !== selectedToken) return null;

    // Single point - render just a dot
    if (dataPoints === 1) {
      const point = priceHistory[0];
      return (
        <g key={dataKey}>
          <circle
            cx={scaleX(0)}
            cy={scaleY(point[dataKey])}
            r="5"
            fill={color}
            stroke="#0f172a"
            strokeWidth="2"
          />
        </g>
      );
    }

    const points = priceHistory.map((p, i) => `${scaleX(i)},${scaleY(p[dataKey])}`).join(' ');

    return (
      <g key={dataKey}>
        <defs>
          <linearGradient id={`gradient-${dataKey}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={color} stopOpacity="0.3" />
            <stop offset="100%" stopColor={color} stopOpacity="0.05" />
          </linearGradient>
        </defs>
        <polygon
          points={`${scaleX(0)},${chartHeight - padding.bottom} ${points} ${scaleX(dataPoints - 1)},${chartHeight - padding.bottom}`}
          fill={`url(#gradient-${dataKey})`}
        />
        <polyline
          points={points}
          fill="none"
          stroke={color}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Data points */}
        {priceHistory.map((p, i) => (
          <circle
            key={`${dataKey}-${i}`}
            cx={scaleX(i)}
            cy={scaleY(p[dataKey])}
            r={i === dataPoints - 1 ? 5 : 2}
            fill={color}
            stroke="#0f172a"
            strokeWidth="1.5"
            opacity={i === dataPoints - 1 ? 1 : 0.7}
          />
        ))}
        {/* Current price label */}
        <g>
          <rect
            x={chartWidth - padding.right + 2}
            y={scaleY(priceHistory[dataPoints - 1][dataKey]) - 12}
            width="72"
            height="24"
            fill={color}
            rx="4"
          />
          <text
            x={chartWidth - padding.right + 38}
            y={scaleY(priceHistory[dataPoints - 1][dataKey]) + 4}
            fontSize="11"
            fill="#fff"
            textAnchor="middle"
            fontFamily="monospace"
            fontWeight="bold"
          >
            ${priceHistory[dataPoints - 1][dataKey].toFixed(6)}
          </text>
        </g>
      </g>
    );
  };

  const getChangePercent = (token: TokenPriceInfo) => {
    if (token.prevPrice === 0) return 0;
    return ((token.price - token.prevPrice) / token.prevPrice) * 100;
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className="rounded-2xl border border-primary bg-black/95 overflow-hidden"
    >
      {/* Header */}
      <div className="p-4 border-b border-border/50">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="font-display text-lg tracking-wide text-foreground">LIVE PRICE</span>
            {isLoading && <RefreshCw className="h-3 w-3 animate-spin text-muted-foreground" />}
          </div>
          <div className="flex items-center gap-2">
            {/* <span className="text-xs text-muted-foreground mr-2">5min window • 3s refresh</span> */}
            <Button variant="ghost" size="sm" onClick={handleZoomOut} className="h-7 w-7 p-0">
              <ZoomOut className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={handleResetZoom} className="h-7 w-7 p-0">
              <RotateCcw className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={handleZoomIn} className="h-7 w-7 p-0">
              <ZoomIn className="h-4 w-4" />
            </Button>
            <span className="text-xs text-muted-foreground ml-1">{(zoomLevel * 100).toFixed(0)}%</span>
          </div>
        </div>

        {/* Token Selector Cards */}
        <div className="grid grid-cols-3 gap-3">
          {(Object.entries(prices) as [TokenKey, TokenPriceInfo][]).map(([key, info]) => {
            const change = getChangePercent(info);
            const isSelected = selectedToken === key;
            return (
              <div
                key={key}
                onClick={() => setSelectedToken(key)}
                className={`p-3 rounded-lg border cursor-pointer transition-all ${
                  isSelected 
                    ? 'ring-2 ring-offset-2 ring-offset-background' 
                    : 'opacity-60 hover:opacity-80'
                }`}
                style={{
                  backgroundColor: `${info.color}${isSelected ? '20' : '10'}`,
                  borderColor: `${info.color}${isSelected ? '80' : '40'}`,
                  ...(isSelected ? { '--tw-ring-color': info.color } as React.CSSProperties : {})
                }}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: info.color }}
                    />
                    <span className="text-xs font-bold" style={{ color: info.color }}>{key}</span>
                  </div>
                  <div className={`flex items-center gap-1 text-xs ${change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {change >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                    <span>{change >= 0 ? '+' : ''}{change.toFixed(4)}%</span>
                  </div>
                </div>
                <motion.div
                  key={info.price}
                  initial={{ scale: 1.03, color: change >= 0 ? '#22c55e' : '#ef4444' }}
                  animate={{ scale: 1, color: info.color }}
                  transition={{ duration: 0.3 }}
                  className="font-mono text-xl font-bold"
                >
                  ${info.price.toFixed(6)}
                </motion.div>
              </div>
            );
          })}
        </div>
      </div>
      {/* Chart */}
      <div className="relative bg-slate-950/80 w-full" style={{ height: chartHeight }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={priceHistory}
            margin={{ top: padding.top, right: 0, left: 0, bottom: 0 }}
          >
            <defs>
              <linearGradient id={`gradient-${selectedToken}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={tokenColor} stopOpacity={0.4} />
                <stop offset="95%" stopColor={tokenColor} stopOpacity={0.0} />
              </linearGradient>
              <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="4" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.1)" vertical={false} />
            <XAxis 
              dataKey="time" 
              hide 
            />
            <YAxis 
              domain={[minPrice, maxPrice]} 
              hide 
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="bg-slate-900/95 backdrop-blur-xl border border-white/10 rounded-xl p-3 shadow-2xl">
                      <div className="flex items-center gap-2 mb-1 text-muted-foreground text-xs font-medium">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: tokenColor }} />
                        {selectedToken} Price
                      </div>
                      <div className="text-white font-mono text-lg font-bold">
                        ${Number(payload[0].value).toFixed(6)}
                      </div>
                      <div className="text-muted-foreground text-[10px] mt-2">
                        {new Date(payload[0].payload.time).toLocaleTimeString()}
                      </div>
                    </div>
                  );
                }
                return null;
              }}
              cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 1, strokeDasharray: '4 4' }}
            />
            <Area
              type="monotone"
              dataKey={selectedToken}
              stroke={tokenColor}
              strokeWidth={3}
              fillOpacity={1}
              fill={`url(#gradient-${selectedToken})`}
              filter="url(#glow)"
              isAnimationActive={false} // Disable to avoid flicker on polling
            />
          </AreaChart>
        </ResponsiveContainer>

        {/* Selected Token Indicator */}
        <div className="absolute bottom-4 left-4 flex items-center gap-2 text-xs bg-slate-900/60 backdrop-blur-md border border-white/5 px-3 py-1.5 rounded-lg shadow-xl">
          <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: tokenColor }} />
          <span className="text-gray-300 font-medium">{selectedToken} Live Data</span>
          <span className="text-gray-500 mx-1">|</span>
          <span className="text-gray-400 font-mono">{priceHistory.length} points</span>
        </div>
        
        {/* Y Axis Labels (Custom Overlay for styling) */}
        <div className="absolute right-4 top-0 bottom-0 py-6 flex flex-col justify-between pointer-events-none text-[10px] font-mono text-muted-foreground/50 text-right">
          <span>${maxPrice.toFixed(4)}</span>
          <span>${currentPrice.toFixed(4)}</span>
          <span>${minPrice.toFixed(4)}</span>
        </div>
      </div>
    </motion.div>
  );
};

export default PriceChart;