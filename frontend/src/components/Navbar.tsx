import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Link, useLocation, useNavigate } from "react-router-dom";

const navLinks = [
  { name: "Home", href: "/" },
  { name: "API Endpoints", href: "/api-endpoints" },
  { name: "Pricing", href: "/pricing" },
  { name: "FAQ", href: "/faq" }
];

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav 
      className={`fixed top-0 left-1/2 z-50 w-[95%] rounded-full transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] ${
        isScrolled 
          ? "translate-y-4 max-w-[360px] -translate-x-1/2 bg-black border border-primary shadow-[0_0_20px_rgba(255,138,0,0.4)]" 
          : "translate-y-6 max-w-5xl -translate-x-1/2 bg-black border border-primary shadow-[0_0_25px_rgba(255,138,0,0.6)]"
      }`}
    >
      <div className={`flex items-center justify-between transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] ${isScrolled ? "px-4 py-2" : "px-6 py-3"}`}>
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-lg shadow-[0_0_15px_rgba(var(--primary),0.5)]">
            A
          </div>
          <span className="text-lg font-semibold text-foreground tracking-tight">ArbiGent</span>
        </div>

        <div className={`hidden md:flex items-center gap-1 overflow-hidden transition-all duration-500 ${isScrolled ? "max-w-0 opacity-0 pointer-events-none" : "max-w-[400px] opacity-100"}`}>
          {navLinks.map((link) => {
            const isActive = link.href === location.pathname || (link.name === "Home" && location.pathname === "/");
            const isAnchor = link.href.includes('#');

            return isAnchor ? (
              <a
                key={link.name}
                href={link.name === "Home" ? "/" : link.href}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 whitespace-nowrap ${
                  isActive
                    ? "bg-secondary/80 text-foreground shadow-inner"
                    : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                }`}
              >
                {isActive && (
                 <span className="inline-block w-1.5 h-1.5 rounded-full bg-primary mr-2 shadow-[0_0_8px_rgba(var(--primary),0.8)]" />
                )}
                {link.name}
              </a>
            ) : (
              <Link
                key={link.name}
                to={link.href}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 whitespace-nowrap ${
                  isActive
                    ? "bg-secondary/80 text-foreground shadow-inner"
                    : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                }`}
              >
                {isActive && (
                 <span className="inline-block w-1.5 h-1.5 rounded-full bg-primary mr-2 shadow-[0_0_8px_rgba(var(--primary),0.8)]" />
                )}
                {link.name}
              </Link>
            );
          })}
        </div>

        <Button variant="hero" size="default" className="hidden md:inline-flex">
          Connect Wallet
        </Button>
      </div>
    </nav>
  );
};

export default Navbar;
