interface CryptoLogoProps {
  symbol: "APT" | "USDC" | "USDT";
  size?: "sm" | "md" | "lg";
  className?: string;
}

const CryptoLogo = ({ symbol, size = "md", className = "" }: CryptoLogoProps) => {
  const sizeClasses = {
    sm: "h-6 w-6",
    md: "h-10 w-10",
    lg: "h-14 w-14",
  };
  
  const textSizes = {
    sm: "text-[8px]",
    md: "text-xs",
    lg: "text-sm",
  };

  if (symbol === "APT") {
    return (
      <div className={`${sizeClasses[size]} relative flex items-center justify-center rounded-full overflow-hidden shadow-lg ${className}`}>
        <img 
          src="/aptos_icon.png" 
          alt="APT" 
          className="h-full w-full object-cover"
        />
      </div>
    );
  }

  if (symbol === "USDC") {
    return (
      <div className={`${sizeClasses[size]} relative flex items-center justify-center rounded-full bg-gradient-to-br from-[#2775CA] to-[#1A5FB4] shadow-lg ${className}`}>
        <div className="flex flex-col items-center justify-center text-white font-bold">
          <span className={`${textSizes[size]} leading-none`}>$</span>
        </div>
        <div className="absolute inset-1 rounded-full border-2 border-white/30" />
      </div>
    );
  }

  if (symbol === "USDT") {
    return (
      <div className={`${sizeClasses[size]} relative flex items-center justify-center rounded-full bg-gradient-to-br from-[#50AF95] to-[#26A17B] shadow-lg ${className}`}>
        <svg viewBox="0 0 24 24" fill="none" className="h-3/5 w-3/5">
          <path 
            d="M12 4V20M8 7H16" 
            stroke="white" 
            strokeWidth="2.5" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          />
        </svg>
      </div>
    );
  }

  return null;
};

export default CryptoLogo;
