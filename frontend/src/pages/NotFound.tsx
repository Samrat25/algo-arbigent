import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { motion } from "framer-motion";
import { Home, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

// Low-brightness animated background component (matches Vault.tsx style)
const AnimatedBackground = () => (
  <div className="fixed inset-0 pointer-events-none">
    <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/[0.07] rounded-full blur-3xl animate-pulse" />
    <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-orange-500/[0.07] rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1s" }} />
    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-r from-primary/[0.03] to-orange-500/[0.03] rounded-full blur-3xl" />
  </div>
);

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background dark relative overflow-hidden">
      <AnimatedBackground />
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="text-center relative z-10 p-10"
      >
        <motion.div
          animate={{ y: [-5, 5, -5], rotate: [0, 5, -5, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          className="relative inline-block mb-6"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-primary to-orange-500 rounded-full blur-2xl opacity-20" />
          <div className="relative bg-gradient-to-br from-primary/20 to-orange-500/20 p-6 rounded-2xl border border-primary/30">
            <AlertTriangle className="h-12 w-12 text-primary" />
          </div>
        </motion.div>
        
        <motion.h1 
          className="mb-4 text-7xl font-bold font-display bg-gradient-to-r from-primary to-orange-400 bg-clip-text text-transparent"
          animate={{ backgroundPosition: ["0%", "100%", "0%"] }}
          transition={{ duration: 5, repeat: Infinity }}
          style={{ backgroundSize: "200%" }}
        >
          404
        </motion.h1>
        
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mb-8 text-xl text-muted-foreground"
        >
          Oops! Page not found
        </motion.p>
        
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <Button asChild variant="glow" size="lg" className="font-display tracking-wide">
            <Link to="/">
              <Home className="h-5 w-5 mr-2" />
              Return to Home
            </Link>
          </Button>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default NotFound;
