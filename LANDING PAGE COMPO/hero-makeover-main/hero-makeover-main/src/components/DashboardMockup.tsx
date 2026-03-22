const DashboardMockup = () => {
  return (
    <div className="relative w-full max-w-[600px] opacity-0 animate-slide-in-right" style={{ animationDelay: "0.4s" }}>
      <div className="rounded-2xl border border-border bg-card/80 shadow-2xl overflow-hidden glow-sm">
        {/* Top bar */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground text-xs font-bold">B</div>
          <div className="flex-1 flex items-center gap-2">
            <div className="flex-1 h-8 rounded-lg bg-secondary/60 flex items-center px-3 text-xs text-muted-foreground">
              <svg className="w-3.5 h-3.5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
              Search
            </div>
          </div>
        </div>

        <div className="flex">
          {/* Sidebar icons */}
          <div className="w-12 border-r border-border py-4 flex flex-col items-center gap-4">
            {[...Array(7)].map((_, i) => (
              <div key={i} className="w-5 h-5 rounded bg-secondary/50" />
            ))}
          </div>

          {/* Main content */}
          <div className="flex-1 p-5">
            <div className="mb-1 text-xs text-muted-foreground">Total balance</div>
            <div className="flex items-baseline gap-3 mb-4">
              <span className="text-2xl font-bold text-foreground font-hero">$18,750.00</span>
              <span className="text-xs text-emerald-400">↑ 2.80%</span>
            </div>

            {/* Chart area */}
            <div className="h-32 mb-5 relative">
              <svg viewBox="0 0 400 120" className="w-full h-full" preserveAspectRatio="none">
                <polyline
                  fill="none"
                  stroke="hsl(270 80% 65%)"
                  strokeWidth="2.5"
                  points="0,90 40,85 80,70 120,75 160,50 200,30 240,25 280,35 320,40 360,38 400,42"
                />
                <polyline
                  fill="none"
                  stroke="hsl(25 90% 55%)"
                  strokeWidth="2"
                  strokeDasharray="4 4"
                  points="0,95 40,88 80,82 120,80 160,65 200,55 240,50 280,48 320,52 360,55 400,58"
                />
                {/* Tooltip dot */}
                <circle cx="200" cy="30" r="4" fill="hsl(270 80% 65%)" />
                <rect x="175" y="6" width="50" height="20" rx="6" fill="hsl(150 60% 40%)" />
                <text x="200" y="19" textAnchor="middle" fill="white" fontSize="9" fontWeight="bold">$61,968</text>
              </svg>
            </div>

            {/* Bottom cards */}
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-secondary/50 p-4">
                <div className="text-xs text-muted-foreground mb-1">Balance</div>
                <div className="text-lg font-bold text-foreground">$69,390</div>
                <div className="text-xs text-emerald-400 mt-1">↑ 3.80%</div>
                <div className="flex gap-2 mt-3">
                  {["$", "€", "¥"].map((c) => (
                    <div key={c} className="w-8 h-8 rounded-lg bg-card flex items-center justify-center text-xs text-muted-foreground border border-border">
                      {c}
                    </div>
                  ))}
                </div>
              </div>
              <div className="rounded-xl bg-secondary/50 p-4">
                <div className="text-xs text-muted-foreground mb-1">Investments</div>
                <div className="text-sm font-bold text-foreground">$2,468.00</div>
                <div className="text-xs text-emerald-400 mt-1">↑ 3.80%</div>
                <div className="flex gap-1 mt-3">
                  {[28, 42, 35, 50, 38].map((h, i) => (
                    <div key={i} className="flex-1 flex flex-col justify-end h-10">
                      <div
                        className="rounded-sm bg-primary/60"
                        style={{ height: `${h}%` }}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardMockup;
