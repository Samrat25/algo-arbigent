import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import ShapeGrid from "@/components/ShapeGrid";
import { motion } from "framer-motion";
import { 
  History as HistoryIcon, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Activity, 
  Search,
  Filter,
  RefreshCw,
  ExternalLink,
  ChevronRight
} from "lucide-react";
import { apiService, TransactionLog } from "@/services/ApiService";
import { useAlgorandWallet } from "@/contexts/AlgorandWalletContext";
import { format } from "date-fns";

const History = () => {
  const [transactions, setTransactions] = useState<TransactionLog[]>([]);
  const [agentActivity, setAgentActivity] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'transactions' | 'agent'>('agent');
  const { account, connected } = useAlgorandWallet();

  useEffect(() => {
    const fetchData = async () => {
      if (!connected || !account?.address) return;
      
      setIsLoading(true);
      try {
        const [txRes, activityRes] = await Promise.all([
          apiService.getTransactionHistory(account.address),
          // Fallback if the endpoint is not ready or has a different name
          fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/agents/${account.address}/activity`).then(res => res.json()).catch(() => ({ success: false }))
        ]);

        if (txRes.success && txRes.data) {
          setTransactions(txRes.data);
        }

        if (activityRes.success && activityRes.activity) {
          setAgentActivity(activityRes.activity);
        }
      } catch (err) {
        console.error("Failed to fetch history:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [connected, account?.address]);

  const StatusBadge = ({ status }: { status: string }) => {
    const colors: Record<string, string> = {
      confirmed: "bg-green-500/20 text-green-400 border-green-500/30",
      pending: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
      failed: "bg-red-500/20 text-red-400 border-red-500/30",
      success: "bg-green-500/20 text-green-400 border-green-500/30",
    };
    
    return (
      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${colors[status.toLowerCase()] || "bg-gray-500/20 text-gray-400 border-gray-500/30"}`}>
        {status}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-background dark text-foreground relative overflow-hidden selection:bg-primary/30">
      {/* Background */}
      <div className="fixed inset-0 z-0 opacity-40 pointer-events-none">
        <ShapeGrid 
          speed={0}
          squareSize={77}
          direction="diagonal"
          borderColor="#271E37"
          hoverFillColor="#222222"
          shape="square"
          hoverTrailAmount={0}
        />
      </div>

      <Navbar />

      <main className="pt-32 pb-16 relative z-10">
        <div className="container mx-auto px-6 lg:px-12 max-w-7xl">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className="flex items-center gap-3 text-primary mb-2">
                <HistoryIcon className="h-5 w-5" />
                <span className="text-sm font-bold tracking-[0.2em] uppercase">Operations Registry</span>
              </div>
              <h1 className="font-hero text-4xl lg:text-6xl font-bold tracking-tight text-white mb-4 uppercase">
                Activity <span className="text-primary glow-text">Logs</span>
              </h1>
              <p className="text-muted-foreground text-lg max-w-xl">
                Real-time tracking of agentic operations, smart contract executions, and vault transactions.
              </p>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="flex bg-black/40 backdrop-blur-md p-1 rounded-2xl border border-white/10"
            >
              <button
                onClick={() => setActiveTab('agent')}
                className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 flex items-center gap-2 ${activeTab === 'agent' ? 'bg-primary text-black shadow-lg shadow-primary/20' : 'text-muted-foreground hover:text-white'}`}
              >
                <Activity className="h-4 w-4" />
                AGENT ACTIVITY
              </button>
              <button
                onClick={() => setActiveTab('transactions')}
                className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 flex items-center gap-2 ${activeTab === 'transactions' ? 'bg-primary text-black shadow-lg shadow-primary/20' : 'text-muted-foreground hover:text-white'}`}
              >
                <RefreshCw className="h-4 w-4" />
                TRANSACTIONS
              </button>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-[2rem] overflow-hidden"
          >
            {activeTab === 'agent' ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-white/10 bg-white/5">
                      <th className="px-8 py-5 text-xs font-bold text-muted-foreground uppercase tracking-widest">Time</th>
                      <th className="px-8 py-5 text-xs font-bold text-muted-foreground uppercase tracking-widest">Agent</th>
                      <th className="px-8 py-5 text-xs font-bold text-muted-foreground uppercase tracking-widest">Action</th>
                      <th className="px-8 py-5 text-xs font-bold text-muted-foreground uppercase tracking-widest">Priority</th>
                      <th className="px-8 py-5 text-xs font-bold text-muted-foreground uppercase tracking-widest">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {isLoading ? (
                      <tr>
                        <td colSpan={5} className="px-8 py-20 text-center text-muted-foreground">
                          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 opacity-20" />
                          ACCESSING HISTORICAL DATA...
                        </td>
                      </tr>
                    ) : agentActivity.length > 0 ? (
                      agentActivity.map((log, i) => (
                        <tr key={i} className="hover:bg-white/5 transition-colors group">
                          <td className="px-8 py-5 font-mono text-sm text-muted-foreground">
                            {format(new Date(log.createdAt), 'HH:mm:ss')}
                          </td>
                          <td className="px-8 py-5">
                            <span className="font-bold text-white uppercase">{log.agentType}</span>
                          </td>
                          <td className="px-8 py-5">
                            <p className="text-white text-sm">{log.action}</p>
                            <p className="text-[10px] text-muted-foreground mt-1 line-clamp-1 italic">{log.input}</p>
                          </td>
                          <td className="px-8 py-5">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded bg-white/5 ${log.priority === 'high' ? 'text-orange-500' : 'text-blue-400'}`}>
                              {log.priority.toUpperCase()}
                            </span>
                          </td>
                          <td className="px-8 py-5">
                            <StatusBadge status={log.status} />
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="px-8 py-20 text-center text-muted-foreground">
                          NO AGENT ACTIVITY RECORDED IN THIS SECTOR.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-white/10 bg-white/5">
                      <th className="px-8 py-5 text-xs font-bold text-muted-foreground uppercase tracking-widest">Time</th>
                      <th className="px-8 py-5 text-xs font-bold text-muted-foreground uppercase tracking-widest">Type</th>
                      <th className="px-8 py-5 text-xs font-bold text-muted-foreground uppercase tracking-widest">Asset</th>
                      <th className="px-8 py-5 text-xs font-bold text-muted-foreground uppercase tracking-widest">Amount</th>
                      <th className="px-8 py-5 text-xs font-bold text-muted-foreground uppercase tracking-widest">Status</th>
                      <th className="px-8 py-5 text-xs font-bold text-muted-foreground uppercase tracking-widest">Registry</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {isLoading ? (
                      <tr>
                        <td colSpan={6} className="px-8 py-20 text-center text-muted-foreground">
                          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 opacity-20" />
                          RETRIEVING LEDGER...
                        </td>
                      </tr>
                    ) : transactions.length > 0 ? (
                      transactions.map((tx, i) => (
                        <tr key={i} className="hover:bg-white/5 transition-colors group">
                          <td className="px-8 py-5 font-mono text-sm text-muted-foreground">
                            {format(new Date(tx.createdAt), 'MMM dd, HH:mm')}
                          </td>
                          <td className="px-8 py-5">
                            <div className="flex items-center gap-2">
                              {tx.type === 'deposit' ? (
                                <ArrowDownLeft className="h-4 w-4 text-green-400" />
                              ) : (
                                <ArrowUpRight className="h-4 w-4 text-orange-400" />
                              )}
                              <span className="font-bold text-white uppercase">{tx.type}</span>
                            </div>
                          </td>
                          <td className="px-8 py-5 font-bold text-white">{tx.coinSymbol}</td>
                          <td className="px-8 py-5">
                            <span className="text-white font-bold">{tx.amountFormatted}</span>
                            <span className="text-[10px] text-muted-foreground ml-1">{tx.coinSymbol}</span>
                          </td>
                          <td className="px-8 py-5">
                            <StatusBadge status={tx.status} />
                          </td>
                          <td className="px-8 py-5">
                            <a 
                              href={`https://testnet.algoexplorer.io/tx/${tx.transactionHash}`}
                              target="_blank"
                              rel="noreferrer"
                              className="text-primary hover:underline flex items-center gap-1 text-xs"
                            >
                              EXPLORER
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} className="px-8 py-20 text-center text-muted-foreground">
                          NO SETTLED TRANSACTIONS FOUND.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </motion.div>
        </div>
      </main>
    </div>
  );
};

export default History;
