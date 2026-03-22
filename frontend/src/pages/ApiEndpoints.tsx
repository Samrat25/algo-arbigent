import React, { useState, useRef, useEffect } from "react";
import Navbar from "@/components/Navbar";
import ShapeGrid from "@/components/ShapeGrid";
import { Terminal as TerminalIcon, ShieldAlert, Cpu } from "lucide-react";

interface ApiEndpointConfig {
  method: "GET" | "POST";
  path: string;
  description: string;
  hasBody?: boolean;
  defaultBody?: string;
}

const endpoints: ApiEndpointConfig[] = [
  { method: "GET", path: "/api/health", description: "Health check for the Faucet / Backend service" },
  { method: "GET", path: "/api/coins", description: "Fetch all supported coin configurations" },
  { method: "GET", path: "/api/vault/0x123...abc", description: "Fetch vault balances for a wallet" },
  { method: "GET", path: "/api/transactions/0x123...abc", description: "Fetch transaction logs" },
  { method: "POST", path: "/api/faucet", description: "Trigger testnet APT faucet drip", hasBody: true, defaultBody: '{"address": "0x123...abc"}' },
  { method: "POST", path: "/api/agents/log", description: "Create an agentic action log", hasBody: true, defaultBody: '{"walletAddress": "0x...", "sessionId": "1", "agentType": "ArbBot", "action": "SCAN", "input": "USDC"}' },
];

const ApiEndpoints = () => {
  const [logs, setLogs] = useState<{ type: 'req' | 'res' | 'err'; text: string; time: string }[]>([]);
  const [isExecuting, setIsExecuting] = useState(false);
  const [commandInput, setCommandInput] = useState("");
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Reset page scroll position precisely to top when first navigating here
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    // Scroll only the terminal container context, completely ignoring the global page
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
    }
  }, [logs]);

  // Focus input when clicking terminal background
  const handleTerminalClick = () => {
    inputRef.current?.focus();
  };

  const handleEndpointSelect = (ep: ApiEndpointConfig) => {
    // Populate the terminal input with the command structure
    if (ep.hasBody) {
      setCommandInput(`${ep.method} ${ep.path} ${ep.defaultBody}`);
    } else {
      setCommandInput(`${ep.method} ${ep.path}`);
    }
    inputRef.current?.focus();
  };

  const executeCommand = async (rawCommand: string) => {
    if (!rawCommand.trim()) return;
    setIsExecuting(true);
    const timestamp = new Date().toLocaleTimeString();
    
    // Log the user's typed command verbatim
    setLogs(prev => [...prev, { type: 'req', text: `> ${rawCommand}`, time: timestamp }]);

    try {
      // Parse command (e.g. "POST /api/faucet {"address": "0x123"}")
      const parts = rawCommand.trim().split(" ");
      const method = (parts[0] || "").toUpperCase();
      const rawPath = parts[1] || "";
      const bodyString = parts.slice(2).join(" ");

      if (!["GET", "POST", "PUT", "DELETE"].includes(method) || !rawPath.startsWith("/")) {
        throw new Error("Invalid syntax. Expected: [METHOD] [PATH] [JSON_BODY] (e.g. GET /api/health)");
      }

      const url = `http://localhost:3001${rawPath.replace("0x123...abc", "0x000000000000000000000000000000000000000000000000000000000000feed")}`;
      
      const config: RequestInit = {
        method: method,
        headers: { 'Content-Type': 'application/json' },
      };
      
      if (bodyString) {
        try {
          config.body = JSON.stringify(JSON.parse(bodyString));
        } catch (e) {
          throw new Error("Invalid JSON payload provided in the command.");
        }
      }

      const response = await fetch(url, config);
      
      // Attempt to parse JSON response, fallback to text
      let data;
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.indexOf("application/json") !== -1) {
        data = await response.json();
      } else {
        data = await response.text();
      }
      
      const resText = `< HTTP ${response.status} ${response.statusText}\n${typeof data === 'string' ? data : JSON.stringify(data, null, 2)}`;
      setLogs(prev => [...prev, { type: response.ok ? 'res' : 'err', text: resText, time: new Date().toLocaleTimeString() }]);

    } catch (err: any) {
      const errText = `< Execution Error:\n${err.message}`;
      setLogs(prev => [...prev, { type: 'err', text: errText, time: new Date().toLocaleTimeString() }]);
    } finally {
      setIsExecuting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      executeCommand(commandInput);
      setCommandInput("");
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary/30 relative dark">
      <Navbar />

      {/* Global Background */}
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

      <div className="container mx-auto px-6 pt-32 pb-24 relative z-10 min-h-screen flex flex-col">
        <div className="mb-12">
          <h1 className="text-4xl md:text-5xl font-hero font-bold mb-4 tracking-tight flex items-center gap-4">
            <TerminalIcon className="w-10 h-10 text-primary" /> Arbigent API
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl">
            Direct CLI access to the ArbiGent core networking layer. Type REST commands standard Unix syntax or click recipes below.
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-8 flex-1">
          {/* Controls Panel */}
          <div className="w-full lg:w-1/3 flex flex-col gap-6">
            <div className="bg-black border border-primary shadow-[0_0_15px_rgba(255,138,0,0.3)] rounded-2xl p-6 relative overflow-hidden group h-full">
              <h2 className="text-xl font-bold mb-4 text-white flex justify-between items-center">
                <span>API Recipes</span>
                <Cpu className="text-primary w-5 h-5" />
              </h2>
              
              <div className="space-y-3">
                {endpoints.map((ep, i) => (
                  <button
                    key={i}
                    onClick={() => handleEndpointSelect(ep)}
                    className="w-full text-left px-4 py-3 rounded-lg border bg-black border-white/10 text-muted-foreground hover:border-primary/50 transition-all duration-300 font-mono text-sm hover:shadow-[0_0_10px_rgba(255,138,0,0.2)]"
                  >
                    <div className="flex items-center gap-3 font-bold mb-1">
                      <span className={`${ep.method === 'GET' ? 'text-blue-400' : 'text-green-400'}`}>
                        {ep.method}
                      </span>
                      <span className="text-white truncate">{ep.path}</span>
                    </div>
                    <div className="text-xs text-muted-foreground font-sans truncate">{ep.description}</div>
                  </button>
                ))}
              </div>

              <div className="mt-8 pt-6 border-t border-white/10 text-xs font-mono text-muted-foreground">
                <p className="mb-2">Syntax Rules:</p>
                <div className="p-3 bg-white/5 rounded">
                 [METHOD] [PATH] [JSON_BODY?]
                 <br/><br/>
                 GET /api/health
                 <br/>
                 POST /api/faucet {"{ \"address\": \"0x123\" }"}
                </div>
              </div>
            </div>
          </div>

          {/* Terminal Window */}
          <div 
            className="w-full lg:w-2/3 flex flex-col bg-black border border-primary shadow-[0_0_20px_rgba(255,138,0,0.4)] hover:shadow-[0_0_30px_rgba(255,138,0,0.6)] transition-shadow duration-500 rounded-2xl overflow-hidden relative"
            onClick={handleTerminalClick}
          >
            
            {/* Window Header */}
            <div className="bg-[#1a1b26] border-b border-white/10 px-4 py-3 flex items-center justify-between">
              <div className="flex gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]" />
                <div className="w-3 h-3 rounded-full bg-yellow-500 shadow-[0_0_8px_rgba(234,179,8,0.6)]" />
                <div className="w-3 h-3 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
              </div>
              <div className="text-xs font-mono text-muted-foreground opacity-60">root@arbigent-core:~</div>
              <div className="flex items-center gap-2 text-xs font-mono text-primary/70">
                {isExecuting && <ShieldAlert className="w-3 h-3 animate-spin" />}
                {isExecuting ? "Executing" : "Idle"}
              </div>
            </div>

            {/* Terminal Body */}
            <div 
              ref={scrollContainerRef}
              className="flex-1 p-6 font-mono text-sm overflow-y-auto max-h-[70vh] custom-scrollbar flex flex-col"
            >
              <div className="text-muted-foreground mb-6 whitespace-pre-wrap">
                ArbiGent Backend Core OS (v1.0.4)
                <br/>
                Connected to localhost:3001
                <br/>
                Type a command or click an API recipe to begin.
                <br/>
              </div>

              <div className="flex flex-col gap-6 mb-4">
                {logs.map((log, index) => (
                  <div key={index} className="flex flex-col gap-1">
                    <div className="text-[10px] text-muted-foreground/60">{log.time}</div>
                    <div className={`whitespace-pre-wrap ${
                      log.type === 'req' ? 'text-blue-300' :
                      log.type === 'err' ? 'text-red-400' : 'text-green-400'
                    }`}>
                      {log.text}
                    </div>
                  </div>
                ))}
              </div>

              {/* Live Input Line */}
              <div className="mt-2 flex items-center gap-2">
                <span className="text-primary font-bold whitespace-nowrap">arbigent-core$</span>
                <input
                  ref={inputRef}
                  type="text"
                  value={commandInput}
                  onChange={(e) => setCommandInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  disabled={isExecuting}
                  className="flex-1 bg-transparent border-none outline-none text-white font-mono placeholder:text-muted-foreground/30 focus:ring-0"
                  spellCheck={false}
                  autoComplete="off"
                  autoFocus
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApiEndpoints;
