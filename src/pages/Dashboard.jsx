import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutGrid,
  Bot,
  Activity,
  Plug,
  FlaskConical,
  ShieldCheck,
  BarChart3,
  Settings,
  ArrowUpRight,
  Zap,
  Cpu,
  Timer,
  Server,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  METRICS,
  LATENCY_SERIES,
  RPM_SERIES,
  LIVE_EVENTS,
  INTEGRATIONS,
  AGENT_NAME,
} from "@/data/mock";
import AgentGraph from "@/components/site/AgentGraph";

const SIDEBAR = [
  { id: "overview", label: "Overview", icon: LayoutGrid },
  { id: "agent", label: "Agent", icon: Bot },
  { id: "runs", label: "Runs", icon: Activity },
  { id: "integrations", label: "Integrations", icon: Plug },
  { id: "tests", label: "Tests", icon: FlaskConical },
  { id: "reliability", label: "Reliability", icon: ShieldCheck },
  { id: "analytics", label: "Analytics", icon: BarChart3 },
  { id: "settings", label: "Settings", icon: Settings },
];

export default function Dashboard() {
  const { section = "overview" } = useParams();
  return (
    <div className="min-h-screen bg-[#050506] text-white flex" data-testid="dashboard-page">
      {/* Sidebar */}
      <aside className="hidden md:flex w-[240px] shrink-0 border-r border-white/[0.06] bg-[#07070a] flex-col">
        <Link to="/" className="flex items-center gap-2 px-5 h-16 border-b border-white/[0.06]">
          <div className="h-7 w-7 rounded-md border border-white/10 bg-white/[0.03] grid place-items-center">
            <div className="h-2 w-2 rounded-[2px] bg-white/85" />
          </div>
          <span className="text-white tracking-tight">{AGENT_NAME}</span>
          <span className="ml-auto font-mono text-[10px] text-white/40">v0.9.2</span>
        </Link>

        <nav className="p-3 flex-1">
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
          <div className="mt-3 font-mono text-[11px] text-white/40">region · iad-1</div>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 min-w-0">
        {/* Topbar */}
        <div className="h-16 border-b border-white/[0.06] px-6 md:px-8 flex items-center justify-between sticky top-0 bg-[#050506]/80 backdrop-blur-xl z-10">
          <div className="flex items-center gap-3 font-mono text-[11px] tracking-widest uppercase text-white/50">
            <span className="text-white/70 capitalize">{section}</span>
            <span className="text-white/30">/</span>
            <span>runtime</span>
          </div>
          <div className="flex items-center gap-2">
            <Link
              to="/"
              className="hidden sm:inline text-[12px] text-white/60 hover:text-white px-3 py-1.5"
            >
              ← Back to site
            </Link>
            <button className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-white/10 text-[12px] text-white/70 hover:text-white hover:border-white/25 transition-colors">
              <Server className="h-3.5 w-3.5" /> iad-1
            </button>
            <button
              data-testid="new-run-btn"
              className="inline-flex items-center gap-1.5 pl-3 pr-2 py-1.5 rounded-full bg-white text-black text-[12px] font-medium"
            >
              New run
              <span className="h-5 w-5 rounded-full bg-black/10 grid place-items-center">
                <ArrowUpRight className="h-3 w-3" />
              </span>
            </button>
          </div>
        </div>

        <div className="p-6 md:p-8 space-y-6">
          {/* Top KPI cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            <KPI label="Agent Status" value="Operational" tone="live" testid="kpi-status" />
            <KPI label="Latency" value={METRICS.latencyAvgMs} suffix=" ms" mono testid="kpi-latency" />
            <KPI label="Success" value={METRICS.successRate} suffix="%" mono testid="kpi-success" />
            <KPI label="Tasks" value={METRICS.tasksCompleted} mono counter testid="kpi-tasks" />
            <KPI label="Apps" value={METRICS.connectedApps} mono testid="kpi-apps" />
            <KPI label="Active Runs" value={METRICS.activeRuns} mono tone="live" testid="kpi-runs" />
          </div>

          {/* Charts + Live */}
          <div className="grid lg:grid-cols-3 gap-4">
            <Card className="lg:col-span-2" testid="chart-latency">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="font-mono text-[10px] tracking-widest uppercase text-white/40">
                    Latency · last 12 min
                  </div>
                  <div className="mt-1 flex items-baseline gap-3">
                    <span className="text-2xl text-white font-mono tracking-tight">
                      {METRICS.latencyAvgMs} ms
                    </span>
                    <span className="text-[11px] text-white/40 font-mono">
                      p95 · {METRICS.latencyP95Ms} ms
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2 font-mono text-[10px] text-white/40 uppercase tracking-widest">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 dot-pulse" /> streaming
                </div>
              </div>
              <SparkArea data={LATENCY_SERIES} height={140} />
            </Card>

            <Card testid="live-activity">
              <div className="flex items-center justify-between mb-3">
                <div className="font-mono text-[10px] tracking-widest uppercase text-white/40">
                  Live activity
                </div>
                <span className="font-mono text-[10px] text-white/30">{LIVE_EVENTS.length} events</span>
              </div>
              <LiveEventStream />
            </Card>
          </div>

          {/* Second row: Agent graph + performance */}
          <div className="grid lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2 rounded-2xl border border-white/[0.08] bg-[#08080a] p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="font-mono text-[10px] tracking-widest uppercase text-white/40">
                  Orchestration · run 82f4c1
                </div>
                <span className="font-mono text-[10px] text-white/30">real-time</span>
              </div>
              <AgentGraph
                variant="full"
                states={{
                  user: "success",
                  understand: "success",
                  plan: "success",
                  search: "success",
                  reason: "running",
                  data: "success",
                  validate: "idle",
                  respond: "idle",
                }}
              />
            </div>
            <Card testid="perf-metrics">
              <div className="font-mono text-[10px] tracking-widest uppercase text-white/40 mb-3">
                Performance
              </div>
              <div className="space-y-4">
                <Metric icon={Timer} label="Tool exec latency" value={`${METRICS.toolLatencyMs} ms`} />
                <Metric icon={Zap} label="Requests / min" value={METRICS.requestsPerMin} />
                <Metric icon={Cpu} label="Tokens processed" value={format(METRICS.tokensProcessed)} />
                <Metric icon={Activity} label="Active sessions" value={METRICS.activeSessions} />
                <Metric icon={ShieldCheck} label="Error rate" value={`${METRICS.errorRate}%`} />
              </div>
              <div className="mt-5 pt-4 border-t border-white/[0.06]">
                <div className="font-mono text-[10px] tracking-widest uppercase text-white/40 mb-2">
                  RPM · 12 min
                </div>
                <SparkArea data={RPM_SERIES} height={64} />
              </div>
            </Card>
          </div>

          {/* Third: integrations preview */}
          <div className="rounded-2xl border border-white/[0.08] bg-[#08080a] p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="font-mono text-[10px] tracking-widest uppercase text-white/40">
                Connected apps
              </div>
              <a href="/#integrations" className="text-[12px] text-white/60 hover:text-white">
                Manage all →
              </a>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {INTEGRATIONS.slice(0, 6).map((i) => (
                <div
                  key={i.name}
                  className="p-3 rounded-lg border border-white/[0.06] bg-[#0a0a0c] flex items-center gap-3"
                >
                  <div className="h-8 w-8 rounded-md border border-white/10 bg-white/[0.04] grid place-items-center font-mono text-[10px] text-white/80">
                    {i.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <div className="text-[13px] text-white truncate">{i.name}</div>
                    <div className="text-[10px] text-white/40 font-mono truncate">{i.used}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Card({ children, className, testid }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={cn(
        "rounded-2xl border border-white/[0.08] bg-[#08080a] p-5",
        className,
      )}
      data-testid={testid}
    >
      {children}
    </motion.div>
  );
}

function KPI({ label, value, suffix = "", mono = false, tone, counter = false, testid }) {
  const [display, setDisplay] = useState(counter ? 0 : value);
  useEffect(() => {
    if (!counter) return;
    let from = 0;
    const to = Number(value) || 0;
    const dur = 900;
    const start = performance.now();
    const step = (now) => {
      const p = Math.min(1, (now - start) / dur);
      setDisplay(Math.floor(from + (to - from) * (1 - Math.pow(1 - p, 3))));
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [counter, value]);

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
        {counter ? display.toLocaleString() : value}
        <span className="text-white/40">{suffix}</span>
      </div>
    </motion.div>
  );
}

function Metric({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center justify-between text-[13px]">
      <span className="flex items-center gap-2 text-white/60">
        <Icon className="h-3.5 w-3.5 text-white/40" />
        {label}
      </span>
      <span className="font-mono text-white">{value}</span>
    </div>
  );
}

function format(n) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(2) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "k";
  return String(n);
}

function SparkArea({ data, height = 120 }) {
  const min = Math.min(...data);
  const max = Math.max(...data);
  const pad = (max - min) * 0.15 || 1;
  const lo = min - pad;
  const hi = max + pad;
  const w = 300;
  const h = height;
  const step = w / (data.length - 1);
  const points = data.map((v, i) => [i * step, h - ((v - lo) / (hi - lo)) * h]);
  const path = points.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  const area = `${path} L${w},${h} L0,${h} Z`;

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full" preserveAspectRatio="none">
      <defs>
        <linearGradient id="g1" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="rgba(255,255,255,0.25)" />
          <stop offset="100%" stopColor="rgba(255,255,255,0)" />
        </linearGradient>
      </defs>
      <path d={area} fill="url(#g1)" />
      <motion.path
        d={path}
        fill="none"
        stroke="rgba(255,255,255,0.9)"
        strokeWidth="1.5"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1.2, ease: "easeOut" }}
      />
      {points.map(([x, y], i) => (
        <circle
          key={i}
          cx={x}
          cy={y}
          r={i === points.length - 1 ? 3 : 0}
          fill="#fff"
        />
      ))}
    </svg>
  );
}

function LiveEventStream() {
  const [events, setEvents] = useState(LIVE_EVENTS);
  useEffect(() => {
    let i = 0;
    const id = setInterval(() => {
      i += 1;
      const now = new Date();
      const t = now.toTimeString().slice(0, 8);
      const msgs = [
        "Planner selected",
        "Search agent invoked",
        "Retrieved 12 documents",
        "Reasoning complete",
        "Validation passed",
        "Response streamed",
        "Memory updated",
      ];
      setEvents((prev) =>
        [{ t, label: msgs[i % msgs.length] }, ...prev].slice(0, 9),
      );
    }, 2400);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="rounded-lg border border-white/[0.06] bg-black/40 p-3 h-[248px] overflow-hidden">
      <AnimatePresence initial={false}>
        {events.map((e, i) => (
          <motion.div
            key={`${e.t}-${e.label}-${i}`}
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1 - i * 0.08, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="flex items-center gap-3 py-1 font-mono text-[11.5px]"
          >
            <span className="text-white/35 shrink-0">{e.t}</span>
            <span className="text-white/80 truncate">{e.label}</span>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
