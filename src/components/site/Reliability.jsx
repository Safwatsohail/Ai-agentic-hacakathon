import { motion } from "framer-motion";
import { Eye, ShieldCheck, Undo2, Radar } from "lucide-react";
import { RELIABILITY_PILLARS } from "@/data/mock";
import { SectionHeading } from "@/components/site/TryAgent";

const ICONS = { observability: Eye, validation: ShieldCheck, recovery: Undo2, transparency: Radar };

export default function Reliability() {
  return (
    <section id="reliability" className="relative py-24 md:py-32">
      <div className="max-w-[1400px] mx-auto px-6 md:px-10">
        <SectionHeading
          eyebrow="Reliability"
          title="Built for reliable execution."
          subtitle="Agents are only useful when you can understand, evaluate, and trust what they do."
        />

        <div className="grid lg:grid-cols-12 gap-6">
          {/* Left: pillars grid */}
          <div className="lg:col-span-6 grid sm:grid-cols-2 gap-4">
            {RELIABILITY_PILLARS.map((p, i) => {
              const Icon = ICONS[p.key];
              return (
                <motion.div
                  key={p.key}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.08 }}
                  className="group relative p-6 rounded-xl border border-white/[0.08] bg-[#0a0a0c] hover:border-white/20 transition-all"
                  data-testid={`reliability-${p.key}`}
                >
                  <div className="flex items-start gap-3">
                    <div className="h-9 w-9 rounded-md border border-white/10 bg-white/[0.03] grid place-items-center">
                      <Icon className="h-4 w-4 text-white/70" />
                    </div>
                    <div>
                      <h4 className="text-white tracking-tight">{p.title}</h4>
                      <p className="text-sm text-white/55 mt-1 leading-relaxed">{p.body}</p>
                    </div>
                  </div>
                  <div className="mt-6 font-mono text-[10px] tracking-widest uppercase text-white/30">
                    01 · pillar
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Right: editorial screenshot placeholder */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="lg:col-span-6 relative rounded-2xl border border-white/[0.08] overflow-hidden min-h-[420px] bg-[#08080a]"
          >
            <div className="absolute inset-0 bg-grid-fine opacity-70 radial-fade" />

            {/* Fake dashboard preview */}
            <div className="relative p-6 h-full flex flex-col">
              <div className="flex items-center justify-between font-mono text-[10px] tracking-widest uppercase text-white/40">
                <span>[ reliability dashboard ]</span>
                <span>live · preview</span>
              </div>

              <div className="mt-6 grid grid-cols-3 gap-3">
                {[
                  { l: "Uptime", v: "99.98%" },
                  { l: "Recovery", v: "0.42 s" },
                  { l: "Validated", v: "97.1%" },
                ].map((m) => (
                  <div key={m.l} className="p-3 rounded-lg border border-white/[0.08] bg-black/40">
                    <div className="font-mono text-[10px] text-white/40 uppercase tracking-widest">
                      {m.l}
                    </div>
                    <div className="mt-1 text-lg text-white font-mono">{m.v}</div>
                  </div>
                ))}
              </div>

              <div className="mt-5 flex-1 rounded-lg border border-white/[0.08] bg-black/40 p-4">
                <div className="font-mono text-[10px] uppercase tracking-widest text-white/40 mb-3">
                  Execution trace · run 82f4c1
                </div>
                <div className="space-y-2 font-mono text-[11px]">
                  {["understand", "plan", "search", "validate", "respond"].map((s, i) => (
                    <div key={s} className="flex items-center gap-3">
                      <span className="text-white/30 w-4">{String(i + 1).padStart(2, "0")}</span>
                      <span className="text-white/80 w-24">{s}</span>
                      <div className="flex-1 h-1 rounded-full bg-white/5 overflow-hidden">
                        <div
                          className="h-full bg-white/60"
                          style={{ width: `${60 + i * 8}%` }}
                        />
                      </div>
                      <span className="text-white/50">{280 + i * 96} ms</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
