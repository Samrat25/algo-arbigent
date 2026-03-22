import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { WalletProvider } from "@txnlab/use-wallet-react";
import { walletManager } from "@/config/walletConfig";
import { AlgorandWalletProvider } from "@/contexts/AlgorandWalletContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import Vault from "./pages/Vault";
import Agents from "./pages/Agents";
import ApiEndpoints from "./pages/ApiEndpoints";
import Pricing from "./pages/Pricing";
import FAQ from "./pages/FAQ";
import History from "./pages/History";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <WalletProvider manager={walletManager}>
      <AlgorandWalletProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              {/* Public route - no wallet connection required */}
              <Route path="/" element={<Index />} />
              <Route path="/api-endpoints" element={<ApiEndpoints />} />
              <Route path="/pricing" element={<Pricing />} />
              <Route path="/faq" element={<FAQ />} />
              
              {/* Protected routes - wallet connection required */}
              <Route 
                path="/dashboard" 
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/vault" 
                element={
                  <ProtectedRoute>
                    <Vault />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/agents" 
                element={
                  <ProtectedRoute>
                    <Agents />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/history" 
                element={
                  <ProtectedRoute>
                    <History />
                  </ProtectedRoute>
                } 
              />
              
              {/* Catch-all route */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AlgorandWalletProvider>
    </WalletProvider>
  </QueryClientProvider>
);

export default App;
