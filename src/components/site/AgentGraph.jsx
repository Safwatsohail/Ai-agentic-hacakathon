import { motion } from "framer-motion";
import { useMemo } from "react";
import { cn } from "@/lib/utils";
import {
  Brain,
  Compass,
  Cog,
  Search,
  Database,
  Terminal,
  ShieldCheck,
  Sparkles,
  Waypoints,
} from "lucide-react";

/**
 * Reusable orchestration graph.
 * variant="hero"  — compact vertical layout for hero
 * variant="full"  — richer branching layout for live execution
 *
 * Each node has a state: idle | running | success | error
 */

const HERO_NODES = [
  { id: "agent", label: "AI AGENT", sub: "orchestrator", icon: Sparkles, x: 50, y: 8 },
  { id: "reason", label: "REASON", sub: "chain of thought", icon: Brain, x: 15, y: 44 },
  { id: "plan", label: "PLAN", sub: "strategy", icon: Compass, x: 50, y: 44 },
  { id: "execute", label: "EXECUTE", sub: "dispatch", icon: Cog, x: 85, y: 44 },
  { id: "toolA", label: "TOOL A", sub: "search", icon: Search, x: 15, y: 82 },
  { id: "toolB", label: "TOOL B", sub: "database", icon: Database, x: 50, y: 82 },
  { id: "toolC", label: "TOOL C", sub: "api", icon: Terminal, x: 85, y: 82 },
];

const HERO_EDGES = [
  ["agent", "reason"],
  ["agent", "plan"],
  ["agent", "execute"],
  ["reason", "toolA"],
  ["plan", "toolB"],
  ["execute", "toolC"],
];

const FULL_NODES = [
  { id: "user", label: "USER REQUEST", sub: "input", icon: Waypoints, x: 50, y: 6 },
  { id: "understand", label: "UNDERSTAND", sub: "parse task", icon: Brain, x: 50, y: 22 },
  { id: "plan", label: "PLAN", sub: "strategy", icon: Compass, x: 50, y: 38 },
  { id: "search", label: "SEARCH AGENT", sub: "web · docs", icon: Search, x: 15, y: 56 },
  { id: "reason", label: "REASONING AGENT", sub: "inference", icon: Brain, x: 50, y: 56 },
  { id: "data", label: "DATA AGENT", sub: "storage", icon: Database, x: 85, y: 56 },
  { id: "validate", label: "VALIDATION", sub: "constraints", icon: ShieldCheck, x: 50, y: 76 },
  { id: "respond", label: "RESPONSE", sub: "output", icon: Sparkles, x: 50, y: 92 },
];

const FULL_EDGES = [
  ["user", "understand"],
  ["understand", "plan"],
  ["plan", "search"],
  ["plan", "reason"],
  ["plan", "data"],
  ["search", "validate"],
  ["reason", "validate"],
  ["data", "validate"],
  ["validate", "respond"],
];

export default function AgentGraph({
  variant = "hero",
  states = {},
  onNodeClick,
  className,
}) {
  const nodes = variant === "hero" ? HERO_NODES : FULL_NODES;
  const edges = variant === "hero" ? HERO_EDGES : FULL_EDGES;

  const nodeMap = useMemo(() => {
    const m = {};
    nodes.forEach((n) => (m[n.id] = n));
    return m;
  }, [nodes]);

  return (
    <div
      className={cn(
        "relative w-full aspect-[4/3] md:aspect-[16/11] rounded-2xl overflow-hidden",
        "glass-strong",
        className,
      )}
      data-testid={`agent-graph-${variant}`}
    >
      {/* subtle grid */}
      <div className="absolute inset-0 bg-grid-fine opacity-60 radial-fade" />
      {/* corner tags */}
      <div className="absolute top-3 left-3 flex items-center gap-2 z-10">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 dot-pulse" />
        <span className="font-mono text-[10px] tracking-widest uppercase text-white/50">
          orchestration · live
        </span>
      </div>
      <div className="absolute top-3 right-3 font-mono text-[10px] tracking-widest text-white/40">
        graph · {variant}
      </div>

      {/* Edges */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
      >
        {edges.map(([from, to], i) => {
          const a = nodeMap[from];
          const b = nodeMap[to];
          if (!a || !b) return null;
          const active =
            states[from] === "success" ||
            states[from] === "running" ||
            states[to] === "running";
          return (
            <g key={i}>
              <line
                x1={a.x}
                y1={a.y + 3}
                x2={b.x}
                y2={b.y - 3}
                stroke="rgba(255,255,255,0.08)"
                strokeWidth="0.15"
                vectorEffect="non-scaling-stroke"
              />
              {active && (
                <line
                  x1={a.x}
                  y1={a.y + 3}
                  x2={b.x}
                  y2={b.y - 3}
                  stroke="rgba(255,255,255,0.75)"
                  strokeWidth="0.25"
                  vectorEffect="non-scaling-stroke"
                  className="dashflow"
                />
              )}
            </g>
          );
        })}
      </svg>

      {/* Nodes */}
      {nodes.map((n, idx) => {
        const state = states[n.id] || "idle";
        return (
          <motion.button
            key={n.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.08, duration: 0.5, ease: [0.2, 0.8, 0.2, 1] }}
            onClick={() => onNodeClick?.(n.id)}
            style={{
              left: `${n.x}%`,
              top: `${n.y}%`,
              transform: "translate(-50%,-50%)",
            }}
            className={cn(
              "absolute z-10 group text-left",
              "px-3 py-2 rounded-lg border transition-all",
              "min-w-[112px] backdrop-blur-md",
              state === "idle" &&
                "bg-white/[0.02] border-white/10 text-white/70 hover:border-white/25",
              state === "running" &&
                "bg-white/[0.06] border-white/40 text-white shadow-[0_0_0_1px_rgba(255,255,255,0.05),0_10px_40px_-10px_rgba(255,255,255,0.15)]",
              state === "success" &&
                "bg-emerald-400/5 border-emerald-400/30 text-white",
              state === "error" && "bg-red-500/10 border-red-500/40 text-white",
            )}
            data-testid={`graph-node-${n.id}`}
          >
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  "h-1.5 w-1.5 rounded-full",
                  state === "idle" && "bg-white/25",
                  state === "running" && "bg-white dot-pulse",
                  state === "success" && "bg-emerald-400",
                  state === "error" && "bg-red-500",
                )}
              />
              <n.icon className="h-3 w-3 text-white/60" />
              <span className="font-mono text-[10px] tracking-[0.14em] uppercase">
                {n.label}
              </span>
            </div>
            <div className="mt-0.5 pl-[18px] text-[10px] text-white/40 font-mono">
              {n.sub}
            </div>
          </motion.button>
        );
      })}
    </div>
  );
}
