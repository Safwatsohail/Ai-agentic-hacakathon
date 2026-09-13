import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ArrowUpRight, Play, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import AgentGraph from "@/components/site/AgentGraph";
import { AGENT_NAME } from "@/data/mock";

const HERO_SEQ = ["agent", "reason", "plan", "execute", "toolA", "toolB", "toolC"];

export default function Hero() {
  const [states, setStates] = useState({});

  // Sequential activation on mount, then loop with a soft pause.
  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      while (!cancelled) {
        const s = {};
        for (const id of HERO_SEQ) {
          if (cancelled) return;
          s[id] = "running";
          setStates({ ...s });
          await new Promise((r) => setTimeout(r, 520));
          s[id] = "success";
          setStates({ ...s });
        }
        await new Promise((r) => setTimeout(r, 1400));
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section
      id="product"
      className="relative pt-32 pb-24 md:pt-40 md:pb-32 overflow-hidden"
      data-testid="hero-section"
    >
      {/* backdrops */}
      <div className="absolute inset-0 bg-grid-fine opacity-60 radial-fade pointer-events-none" />
      <div className="absolute top-0 inset-x-0 h-[420px] bg-[radial-gradient(ellipse_at_top,rgba(255,255,255,0.08),transparent_60%)] pointer-events-none" />

      <div className="relative max-w-[1400px] mx-auto px-6 md:px-10">
        {/* Eyebrow */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="flex items-center gap-2 mb-8"
        >
          <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full glass text-[11px] font-mono tracking-widest uppercase text-white/60">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 dot-pulse" />
            {AGENT_NAME} · hackathon 2026
          </span>
          <span className="hidden md:inline text-[11px] font-mono tracking-widest text-white/30 uppercase">
            /  agent runtime  ·  v0.9.2
          </span>
        </motion.div>

        <div className="grid lg:grid-cols-12 gap-10 lg:gap-14 items-start">
          <div className="lg:col-span-6 xl:col-span-5">
            <motion.h1
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.7 }}
              className="text-[44px] leading-[1.02] sm:text-6xl lg:text-[68px] tracking-[-0.035em] font-medium text-white"
            >
              AI agents that{" "}
              <span className="font-serif-italic text-white/95">think</span>,
              <br className="hidden sm:block" />
              <span className="font-serif-italic text-white/95">orchestrate</span>,
              and execute.
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25, duration: 0.7 }}
              className="mt-7 text-white/55 text-[15px] md:text-base max-w-[520px] leading-relaxed"
            >
              One intelligent system. Multiple tools. Autonomous orchestration.
              Real-time visibility into every decision the agent makes.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.7 }}
              className="mt-9 flex flex-wrap items-center gap-3"
            >
              <a
                href="#try"
                data-testid="hero-cta-primary"
                className="group inline-flex items-center gap-2 pl-5 pr-2 py-2.5 rounded-full bg-white text-black text-[13px] font-medium hover:bg-white/90 transition-all"
              >
                Try the AI Agent
                <span className="h-7 w-7 rounded-full bg-black/10 grid place-items-center">
                  <Play className="h-3.5 w-3.5 fill-current" />
                </span>
              </a>
              <Link
                to="/dashboard"
                data-testid="hero-cta-secondary"
                className="group inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-white/12 text-white/85 text-[13px] hover:bg-white/[0.04] hover:border-white/25 transition-all"
              >
                Explore the system
                <ArrowUpRight className="h-3.5 w-3.5 -rotate-45 group-hover:rotate-0 transition-transform" />
              </Link>
            </motion.div>

            {/* Sub-stats */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6, duration: 0.9 }}
              className="mt-14 grid grid-cols-3 gap-6 max-w-[520px]"
            >
              {[
                { k: "482 ms", v: "avg. latency" },
                { k: "98.7%", v: "success rate" },
                { k: "12", v: "connected apps" },
              ].map((s) => (
                <div
                  key={s.v}
                  className="border-l border-white/10 pl-3"
                  data-testid={`hero-stat-${s.v.replace(/\s+/g, "-")}`}
                >
                  <div className="font-mono text-lg text-white tracking-tight">
                    {s.k}
                  </div>
                  <div className="text-[11px] uppercase tracking-widest text-white/40 mt-1">
                    {s.v}
                  </div>
                </div>
              ))}
            </motion.div>
          </div>

          {/* Visual */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35, duration: 0.9, ease: [0.2, 0.8, 0.2, 1] }}
            className="lg:col-span-6 xl:col-span-7"
          >
            <AgentGraph variant="hero" states={states} />
            {/* Under-graph micro caption */}
            <div className="mt-4 flex items-center justify-between font-mono text-[10px] tracking-widest uppercase text-white/40">
              <span className="flex items-center gap-2">
                <Sparkles className="h-3 w-3" />
                real-time agent orchestration
              </span>
              <span>run · 82f4c1</span>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
