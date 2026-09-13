import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Play, X } from "lucide-react";
import { BENCHMARK, TEST_SUITE } from "@/data/mock";
import { SectionHeading } from "@/components/site/TryAgent";
import { cn } from "@/lib/utils";

export default function Testing() {
  const [running, setRunning] = useState(false);
  const [results, setResults] = useState([]);
  const [current, setCurrent] = useState(-1);

  const runAll = async () => {
    setRunning(true);
    setResults([]);
    for (let i = 0; i < TEST_SUITE.length; i++) {
      setCurrent(i);
      await new Promise((r) => setTimeout(r, TEST_SUITE[i].duration));
      setResults((prev) => [...prev, { ...TEST_SUITE[i], passed: true }]);
    }
    setCurrent(-1);
    setRunning(false);
  };

  const passed = results.filter((r) => r.passed).length;

  return (
    <section id="tests" className="relative py-24 md:py-32">
      <div className="max-w-[1400px] mx-auto px-6 md:px-10">
        <SectionHeading
          eyebrow="Evaluations"
          title="Test the intelligence."
          subtitle="Continuous evaluation across research, reasoning, extraction, and recovery tasks."
        />

        {/* Benchmarks */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {BENCHMARK.map((b, i) => (
            <motion.div
              key={b.label}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.06 }}
              className="p-5 rounded-xl border border-white/[0.08] bg-[#0a0a0c]"
              data-testid={`benchmark-${b.label.toLowerCase().replace(/\s+/g, "-")}`}
            >
              <div className="font-mono text-[10px] tracking-widest uppercase text-white/40">
                {b.label}
              </div>
              <div className="mt-2 flex items-baseline gap-1">
                <span className="text-3xl text-white tracking-tight font-mono">{b.value}</span>
                <span className="text-white/40 text-sm">%</span>
              </div>
              <div className="mt-4 h-1 rounded-full bg-white/5 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  whileInView={{ width: `${b.value}%` }}
                  viewport={{ once: true }}
                  transition={{ duration: 1, delay: 0.1 + i * 0.08, ease: "easeOut" }}
                  className="h-full bg-white/70"
                />
              </div>
            </motion.div>
          ))}
        </div>

        {/* Test runner */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="rounded-2xl border border-white/[0.08] bg-[#08080a] overflow-hidden"
        >
          <div className="flex items-center justify-between px-5 py-3 border-b border-white/[0.06]">
            <div className="font-mono text-[11px] tracking-widest uppercase text-white/50">
              test suite · nexus-agent
            </div>
            <button
              onClick={runAll}
              disabled={running}
              data-testid="run-tests-btn"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white text-black text-[12px] font-medium hover:bg-white/90 disabled:opacity-40 transition-all"
            >
              {running ? "Running…" : "Run test suite"}
              <Play className="h-3 w-3 fill-current" />
            </button>
          </div>

          <div className="grid md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-white/[0.06]">
            <div className="p-5">
              <div className="space-y-2">
                {TEST_SUITE.map((t, i) => {
                  const result = results.find((r) => r.id === t.id);
                  const active = current === i;
                  return (
                    <div
                      key={t.id}
                      className={cn(
                        "flex items-center justify-between px-3 py-2.5 rounded-md border transition-all font-mono text-[12px]",
                        result
                          ? "border-emerald-400/25 bg-emerald-400/[0.03] text-white"
                          : active
                            ? "border-white/30 bg-white/[0.04] text-white"
                            : "border-white/[0.06] text-white/50",
                      )}
                      data-testid={`test-${t.id}`}
                    >
                      <span className="flex items-center gap-2.5">
                        {result ? (
                          <Check className="h-3.5 w-3.5 text-emerald-400" />
                        ) : active ? (
                          <span className="h-1.5 w-1.5 rounded-full bg-white dot-pulse" />
                        ) : (
                          <span className="h-1.5 w-1.5 rounded-full bg-white/20" />
                        )}
                        {t.name}
                      </span>
                      <span className="text-white/40">{t.duration} ms</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* console */}
            <div className="p-5 min-h-[280px] font-mono text-[12px]">
              <div className="text-[10px] uppercase tracking-widest text-white/40 mb-3">
                console
              </div>
              <AnimatePresence initial={false}>
                {results.length === 0 && !running && (
                  <div className="text-white/25">// waiting to run…</div>
                )}
                {running && current >= 0 && (
                  <motion.div
                    key={`run-${current}`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-white/80"
                  >
                    Running test {String(current + 1).padStart(2, "0")}…{" "}
                    <span className="text-white/40">{TEST_SUITE[current].name}</span>
                  </motion.div>
                )}
                {results.map((r, i) => (
                  <motion.div
                    key={r.id}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-white/80"
                  >
                    Running test {String(i + 1).padStart(2, "0")}…{" "}
                    <span className="text-emerald-400">✓ Passed</span>
                  </motion.div>
                ))}
              </AnimatePresence>
              {!running && results.length === TEST_SUITE.length && (
                <div
                  className="mt-4 pt-4 border-t border-white/[0.08] text-white"
                  data-testid="test-summary"
                >
                  {passed} / {TEST_SUITE.length} tests passed
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
