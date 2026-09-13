import { motion } from "framer-motion";
import { SectionHeading } from "@/components/site/TryAgent";

const ARCH = [
  { id: "user", label: "USER", x: 50, y: 5, tone: "outline" },
  { id: "core", label: "AGENT CORE", x: 50, y: 20 },
  { id: "planner", label: "PLANNER", x: 20, y: 38 },
  { id: "reasoner", label: "REASONER", x: 50, y: 38 },
  { id: "memory", label: "MEMORY", x: 80, y: 38 },
  { id: "router", label: "TOOL ROUTER", x: 50, y: 56 },
  { id: "search", label: "SEARCH", x: 18, y: 74 },
  { id: "apis", label: "APIS", x: 50, y: 74 },
  { id: "db", label: "DATABASES", x: 82, y: 74 },
  { id: "validator", label: "VALIDATOR", x: 50, y: 88 },
  { id: "response", label: "RESPONSE", x: 50, y: 98, tone: "outline" },
];

const ARCH_EDGES = [
  ["user", "core"],
  ["core", "planner"],
  ["core", "reasoner"],
  ["core", "memory"],
  ["planner", "router"],
  ["reasoner", "router"],
  ["memory", "router"],
  ["router", "search"],
  ["router", "apis"],
  ["router", "db"],
  ["search", "validator"],
  ["apis", "validator"],
  ["db", "validator"],
  ["validator", "response"],
];

export default function Architecture() {
  const map = Object.fromEntries(ARCH.map((n) => [n.id, n]));
  return (
    <section id="architecture" className="relative py-24 md:py-32">
      <div className="max-w-[1400px] mx-auto px-6 md:px-10">
        <SectionHeading
          eyebrow="Architecture"
          title="An operating system for agents."
          subtitle="A structured runtime that separates reasoning, orchestration, tool execution, and validation."
        />
        <div className="grid lg:grid-cols-12 gap-10 items-start">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="lg:col-span-8 relative rounded-2xl border border-white/[0.08] bg-[#08080a] overflow-hidden aspect-[4/5] md:aspect-[5/4]"
            data-testid="architecture-diagram"
          >
            <div className="absolute inset-0 bg-grid-fine opacity-60 radial-fade" />
            <svg
              className="absolute inset-0 w-full h-full"
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
            >
              {ARCH_EDGES.map(([f, t], i) => {
                const a = map[f];
                const b = map[t];
                return (
                  <g key={i}>
                    <line
                      x1={a.x}
                      y1={a.y + 2}
                      x2={b.x}
                      y2={b.y - 2}
                      stroke="rgba(255,255,255,0.1)"
                      strokeWidth="0.15"
                      vectorEffect="non-scaling-stroke"
                    />
                    <line
                      x1={a.x}
                      y1={a.y + 2}
                      x2={b.x}
                      y2={b.y - 2}
                      stroke="rgba(255,255,255,0.55)"
                      strokeWidth="0.2"
                      vectorEffect="non-scaling-stroke"
                      className="dashflow"
                      style={{ animationDelay: `${(i * 0.15) % 1.2}s` }}
                    />
                  </g>
                );
              })}
            </svg>
            {ARCH.map((n, i) => (
              <motion.div
                key={n.id}
                initial={{ opacity: 0, scale: 0.94 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.05 }}
                style={{
                  left: `${n.x}%`,
                  top: `${n.y}%`,
                  transform: "translate(-50%,-50%)",
                }}
                className={
                  "absolute px-3 py-1.5 rounded-md font-mono text-[10px] tracking-[0.14em] uppercase " +
                  (n.tone === "outline"
                    ? "border border-white/25 text-white bg-transparent"
                    : "border border-white/10 bg-white/[0.04] text-white/85")
                }
                data-testid={`arch-node-${n.id}`}
              >
                {n.label}
              </motion.div>
            ))}
          </motion.div>

          <div className="lg:col-span-4 space-y-6">
            {[
              {
                t: "Core",
                d: "The orchestrator that plans, delegates, and evaluates every step.",
              },
              {
                t: "Router",
                d: "A typed capability system that routes intents to the right tool.",
              },
              {
                t: "Validator",
                d: "A final gate that enforces constraints and returns confidence.",
              },
            ].map((x, i) => (
              <motion.div
                key={x.t}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="border-l border-white/15 pl-5"
              >
                <div className="font-mono text-[10px] tracking-widest uppercase text-white/40">
                  Component
                </div>
                <div className="mt-1 text-white tracking-tight">{x.t}</div>
                <div className="mt-1 text-sm text-white/55">{x.d}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
