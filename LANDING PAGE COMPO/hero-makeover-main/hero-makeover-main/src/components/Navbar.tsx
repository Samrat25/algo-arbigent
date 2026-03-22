import { Button } from "@/components/ui/button";

const navLinks = ["Home", "Bank", "Features", "Pricing", "FAQ"];

const Navbar = () => {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass-surface">
      <div className="container mx-auto flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-lg">
            B
          </div>
          <span className="text-lg font-semibold text-foreground">Blockera</span>
        </div>

        <div className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => (
            <a
              key={link}
              href={`#${link.toLowerCase()}`}
              className={`px-4 py-2 rounded-full text-sm transition-colors duration-200 ${
                link === "Home"
                  ? "bg-secondary text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {link === "Home" && (
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-primary mr-2" />
              )}
              {link}
            </a>
          ))}
        </div>

        <Button variant="hero" size="default" className="hidden md:inline-flex">
          Get Started
        </Button>
      </div>
    </nav>
  );
};

export default Navbar;
