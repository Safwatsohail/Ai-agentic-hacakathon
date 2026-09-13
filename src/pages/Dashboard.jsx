import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutGrid,
  Bot,
  Activity,
  Plug,
  Settings,
  ArrowUpRight,
  Server,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { RunsScreen, IntegrationsScreen } from "@/components/dashboard/DashboardScreens";

const SIDEBAR = [
  { id: "overview", label: "Overview", icon: LayoutGrid },
  { id: "runs", label: "Runs Log", icon: Activity },
  { id: "integrations", label: "Integrations", icon: Plug },
];

export default function Dashboard() {
  const { section = "overview" } = useParams();
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/metrics')
      .then(res => {
        if (!res.ok) throw new Error("Failed to fetch metrics");
        return res.json();
      })
      .then(data => {
        setMetrics(data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Backend not ready:", err);
        setMetrics({
          status: "Disconnected",
          latency: 0,
          successRate: 0,
          tasks: 0,
          apps: 0,
          runs: 0,
        });
        setLoading(false);
      });
  }, []);

  return (
    <div className="min-h-screen bg-[#050506] text-white flex" data-testid="dashboard-page">
      {/* Sidebar */}
      <aside className="hidden md:flex w-[240px] shrink-0 border-r border-white/[0.06] bg-[#07070a] flex-col">
        <Link to="/" className="flex items-center gap-2 px-5 h-16 border-b border-white/[0.06] group">
          <div className="h-7 w-7 rounded-md grid place-items-center overflow-hidden bg-transparent transition-all">
            <img src="/logo.png" alt="Vernex" className="h-full w-full object-contain" onError={(e) => e.target.style.display='none'} />
          </div>
          <span className="text-white font-medium tracking-tight">Vernex</span>
          <span className="ml-auto font-mono text-[10px] text-white/40">v1.0.0</span>
        </Link>

        <nav className="p-4 flex-1 space-y-1.5">
          {SIDEBAR.map((s) => (
            <Link
              key={s.id}
              to={`/dashboard/${s.id === "overview" ? "" : s.id}`}
              data-testid={`sidebar-${s.id}`}
              className={cn(
                "flex items-center gap-2.5 px-3 py-2 rounded-md text-[13px] transition-all",
                section === s.id
                  ? "bg-white/[0.06] text-white border border-white/10"
                  : "text-white/55 hover:text-white hover:bg-white/[0.03] border border-transparent",
              )}
            >
              <s.icon className="h-3.5 w-3.5" />
              {s.label}
            </Link>
          ))}
        </nav>

        <div className="p-4 m-3 mt-0 rounded-xl border border-white/[0.06] bg-black/40">
          <div className="font-mono text-[10px] tracking-widest uppercase text-white/40">
            Agent status
          </div>
          <div className="mt-1 flex items-center gap-2 text-white">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 dot-pulse" />
            Operational
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 min-w-0 flex flex-col h-screen overflow-y-auto">
        {/* Topbar */}
        <div className="h-16 border-b border-white/[0.06] px-6 md:px-8 flex items-center justify-between sticky top-0 bg-[#050506]/80 backdrop-blur-xl z-10">
          <div className="flex items-center gap-3 font-mono text-[11px] tracking-widest uppercase text-white/50">
            <span className="text-white/70 capitalize">{section}</span>
            <span className="text-white/30">/</span>
            <span>workspace</span>
          </div>
          <div className="flex items-center gap-2">
            <Link
              to="/"
              className="hidden sm:inline text-[12px] text-white/60 hover:text-white px-3 py-1.5 transition-colors"
            >
              ← Back to site
            </Link>
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-white/10 text-[12px] text-white/70 bg-white/[0.02]">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 dot-pulse" />
              API Connected
            </div>
          </div>
        </div>

        <div className="p-8 space-y-8 max-w-7xl mx-auto w-full">
          {section === "overview" && (
            <>
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-2xl font-bold tracking-tight text-white">Platform Overview</h2>
              </div>
              
              {loading ? (
                <div className="flex h-64 items-center justify-center text-white/50"><Loader2 className="h-6 w-6 animate-spin" /></div>
              ) : (
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-6">
                  <KPI label="System Status" value={metrics.status} tone="live" testid="kpi-status" />
                  <KPI label="Average Latency" value={metrics.latency} suffix=" ms" mono testid="kpi-latency" />
                  <KPI label="Task Success" value={metrics.successRate} suffix="%" mono testid="kpi-success" />
                  <KPI label="Total Tasks" value={metrics.tasks} mono testid="kpi-tasks" />
                  <KPI label="Connected Apps" value={metrics.apps} mono testid="kpi-apps" />
                  <KPI label="Active Runs" value={metrics.runs} mono tone="live" testid="kpi-runs" />
                </div>
              )}
            </>
          )}

          {section === "runs" && <RunsScreen />}
          {section === "integrations" && <IntegrationsScreen />}
        </div>
      </div>
    </div>
  );
}

function KPI({ label, value, suffix = "", mono = false, tone, testid }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="p-4 rounded-xl border border-white/[0.08] bg-[#0a0a0c]"
      data-testid={testid}
    >
      <div className="flex items-center gap-1.5 font-mono text-[10px] tracking-widest uppercase text-white/40">
        {tone === "live" && <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 dot-pulse" />}
        {label}
      </div>
      <div
        className={cn(
          "mt-1.5 text-white tracking-tight",
          mono ? "font-mono text-xl" : "text-lg",
        )}
      >
        {value}
        <span className="text-white/40">{suffix}</span>
      </div>
    </motion.div>
  );
}
