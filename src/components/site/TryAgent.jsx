import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Check, ArrowUpRight, X, Zap } from "lucide-react";
import { toast } from "sonner";
import AgentGraph from "@/components/site/AgentGraph";
import { EXECUTION_STAGES, SUGGESTED_TASKS } from "@/data/mock";
import { cn } from "@/lib/utils";

const STAGE_TO_NODE = {
  discord: "understand",
  github_search: "data",
  plan: "plan",
  github_pr: "reason",
  calendar: "validate",
  discord_report: "respond",
};

export default function TryAgent() {
  const [task, setTask] = useState("");
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(false);
  const [logs, setLogs] = useState([]);
  const [stageIdx, setStageIdx] = useState(-1);
  const [nodeStates, setNodeStates] = useState({ user: "success" });
  const [elapsed, setElapsed] = useState(0);
  const startedAt = useRef(null);
  const logEnd = useRef(null);

  useEffect(() => {
    let id;
    if (running) {
      id = setInterval(() => {
        setElapsed(((Date.now() - startedAt.current) / 1000).toFixed(2));
      }, 60);
    }
    return () => clearInterval(id);
  }, [running]);

  useEffect(() => {
    logEnd.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [logs]);

  const run = async (givenTask) => {
    const t = (givenTask ?? task).trim();
    if (!t) {
      toast.error("Give the agent something to accomplish.");
      return;
    }
    setRunning(true);
    setDone(false);
    setLogs([]);
    setStageIdx(-1);
    setNodeStates({ user: "success" });
    startedAt.current = Date.now();
    setElapsed(0);

    const now = () => new Date().toLocaleTimeString("en-GB", { hour12: false });
    setLogs((l) => [...l, { t: now(), label: `agent initialized · task="${t}"` }]);
    await sleep(280);

    for (let i = 0; i < EXECUTION_STAGES.length; i++) {
      const s = EXECUTION_STAGES[i];
      setStageIdx(i);
      const nodeId = STAGE_TO_NODE[s.id];
      setNodeStates((prev) => ({ ...prev, [nodeId]: "running" }));
      setLogs((l) => [...l, { t: now(), label: `${s.label.toLowerCase()} · ${s.detail}` }]);
      await sleep(s.ms);
      setNodeStates((prev) => ({ ...prev, [nodeId]: "success" }));
    }
    setNodeStates((prev) => ({ ...prev, respond: "success" }));
    setLogs((l) => [...l, { t: now(), label: "Action verified. DISCORD → GITHUB → DISCORD → CALENDAR → 4/4 VERIFIED" }]);
    setDone(true);
    setRunning(false);
    toast.success("Agent completed the task.");
  };

  const reset = () => {
    setRunning(false);
    setDone(false);
    setLogs([]);
    setStageIdx(-1);
    setNodeStates({});
    setTask("");
    setElapsed(0);
  };

  return (
    <section
      id="try"
      className="relative py-24 md:py-32"
      data-testid="try-section"
    >
      <div className="max-w-[1400px] mx-auto px-6 md:px-10">
        <SectionHeading
          eyebrow="Interactive · demo"
          title="Try the agent."
          subtitle="Give it any task. Watch it plan, orchestrate, and execute in real time."
        />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7 }}
          className="relative rounded-2xl border border-white/[0.08] bg-[#0a0a0c] overflow-hidden"
        >
          {/* Chrome */}
          <div className="flex items-center justify-between px-5 py-3 border-b border-white/[0.06] bg-white/[0.02]">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-white/12" />
                <span className="h-2.5 w-2.5 rounded-full bg-white/12" />
                <span className="h-2.5 w-2.5 rounded-full bg-white/12" />
              </div>
              <span className="ml-3 font-mono text-[11px] tracking-widest uppercase text-white/50">
                agent · sandbox
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span
                className={cn(
                  "flex items-center gap-2 font-mono text-[11px] tracking-widest uppercase",
                  running ? "text-white" : done ? "text-emerald-400" : "text-white/40",
                )}
                data-testid="try-status"
              >
                <span
                  className={cn(
                    "h-1.5 w-1.5 rounded-full",
                    running ? "bg-white dot-pulse" : done ? "bg-emerald-400" : "bg-white/25",
                  )}
                />
                {running ? "running" : done ? "completed" : "idle"}
              </span>
              <span className="font-mono text-[11px] text-white/40">
                {elapsed || "00.00"}s
              </span>
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-0">
            {/* Left: input */}
            <div className="border-b lg:border-b-0 lg:border-r border-white/[0.06] p-5 md:p-8 flex flex-col justify-center">
              <label className="font-mono text-[10px] tracking-widest uppercase text-white/40">
                Prompt
              </label>
              <textarea
                data-testid="try-input"
                value={task}
                onChange={(e) => setTask(e.target.value)}
                placeholder="What would you like the agent to accomplish?"
                rows={3}
                className="mt-2 w-full resize-none bg-transparent text-[15px] text-white placeholder:text-white/25 outline-none border-b border-white/[0.08] focus:border-white/40 pb-3 transition-colors"
              />

              <div className="mt-4 flex flex-wrap gap-1.5">
                {SUGGESTED_TASKS.slice(0, 3).map((s) => (
                  <button
                    key={s}
                    onClick={() => setTask(s)}
                    data-testid={`try-suggestion-${s.slice(0, 8)}`}
                    className="text-[11px] px-2.5 py-1 rounded-full border border-white/10 text-white/60 hover:text-white hover:border-white/25 transition-colors"
                  >
                    {s}
                  </button>
                ))}
              </div>

              <div className="mt-6 flex items-center gap-2">
                <button
                  onClick={() => run()}
                  disabled={running}
                  data-testid="try-run-btn"
                  className="group inline-flex items-center gap-2 pl-4 pr-2 py-2 rounded-full bg-white text-black text-[13px] font-medium hover:bg-white/90 disabled:opacity-40 transition-all"
                >
                  {running ? "Running…" : "Run Agent"}
                  <span className="h-6 w-6 rounded-full bg-black/10 grid place-items-center">
                    {running ? (
                      <Zap className="h-3.5 w-3.5" />
                    ) : (
                      <ArrowUpRight className="h-3.5 w-3.5 -rotate-45 group-hover:rotate-0 transition-transform" />
                    )}
                  </span>
                </button>
                {(done || running) && (
                  <button
                    onClick={reset}
                    data-testid="try-reset-btn"
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-full border border-white/10 text-white/60 text-[12px] hover:text-white hover:border-white/25 transition-colors"
                  >
                    <X className="h-3.5 w-3.5" /> Reset
                  </button>
                )}
              </div>

              {/* Minimal Live log */}
              <div className="mt-8 pt-6 border-t border-white/[0.06]">
                <div className="flex items-center justify-between mb-3">
                  <span className="font-mono text-[10px] tracking-widest uppercase text-white/40">
                    Live SSE Log
                  </span>
                </div>
                <div className="h-[120px] overflow-y-auto space-y-1.5 pr-2" data-testid="try-log">
                  {logs.length === 0 && (
                    <div className="text-[12px] text-white/25 font-mono">
                      // waiting for agent...
                    </div>
                  )}
                  <AnimatePresence initial={false}>
                    {logs.map((l, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: -4 }}
                        animate={{ opacity: 1, x: 0 }}
                        className={cn(
                          "flex items-start gap-3 font-mono text-[11px] leading-relaxed",
                          i === logs.length - 1 && done ? "text-emerald-400" : "text-white/70"
                        )}
                      >
                        <span className="opacity-40 shrink-0">{l.t}</span>
                        <span>{l.label}</span>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                  <div ref={logEnd} />
                </div>
              </div>
            </div>

            {/* Right: graph */}
            <div className="p-5 md:p-8 flex flex-col justify-center bg-black/20">
              <AgentGraph variant="full" states={nodeStates} className="w-full max-w-md mx-auto mb-8" />
              
              {/* Minimal Stage Strip */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {EXECUTION_STAGES.map((s, i) => {
                  const active = i === stageIdx;
                  const past = i < stageIdx || (done && i <= stageIdx);
                  return (
                    <div
                      key={s.id}
                      className={cn(
                        "px-3 py-2.5 rounded-lg border text-[10px] font-mono tracking-widest uppercase transition-all flex flex-col justify-center",
                        active && "border-white/40 bg-white/[0.03] text-white",
                        past && "border-emerald-500/20 bg-emerald-500/[0.02] text-emerald-400",
                        !active && !past && "border-white/[0.06] text-white/30"
                      )}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        {past ? <Check className="h-3 w-3" /> : active ? <Play className="h-3 w-3" /> : <span className="h-1.5 w-1.5 rounded-full bg-white/20" />}
                        <span className="truncate">{s.label}</span>
                      </div>
                      {active && <span className="text-[9px] text-white/50 lowercase">{s.detail}</span>}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export function SectionHeading({ eyebrow, title, subtitle, align = "left" }) {
  return (
    <div className={cn("mb-12 md:mb-16", align === "center" && "text-center")}>
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="font-mono text-[11px] tracking-widest uppercase text-white/45 mb-4"
      >
        <span className="inline-block h-[1px] w-6 bg-white/40 align-middle mr-3" />
        {eyebrow}
      </motion.div>
      <motion.h2
        initial={{ opacity: 0, y: 10 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, delay: 0.05 }}
        className="text-4xl md:text-5xl lg:text-[56px] leading-[1.05] tracking-[-0.03em] font-medium text-white max-w-3xl"
      >
        {title}
      </motion.h2>
      {subtitle && (
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.15 }}
          className="mt-4 text-white/55 max-w-2xl text-[15px] leading-relaxed"
        >
          {subtitle}
        </motion.p>
      )}
    </div>
  );
}
