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

          {/* Right: editorial minimal visual */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="lg:col-span-6 relative rounded-2xl border border-white/[0.08] overflow-hidden min-h-[420px] bg-[#08080a] flex items-center justify-center"
          >
            <div className="absolute inset-0 bg-grid-fine opacity-70 radial-fade" />
            
            <div className="relative flex flex-col items-center justify-center p-8 text-center space-y-4">
              <div className="h-16 w-16 rounded-full border border-white/10 bg-white/[0.03] grid place-items-center mb-2">
                <Radar className="h-6 w-6 text-white/40" />
              </div>
              <h4 className="text-white font-medium text-lg">Continuous Observability</h4>
              <p className="text-white/40 text-sm max-w-sm">
                Every trace, reasoning step, and tool invocation is recorded and auditable in real-time.
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
