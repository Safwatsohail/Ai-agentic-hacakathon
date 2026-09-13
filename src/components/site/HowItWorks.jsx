import { motion } from "framer-motion";
import { HOW_STEPS } from "@/data/mock";
import { SectionHeading } from "@/components/site/TryAgent";

export default function HowItWorks() {
  return (
    <section id="how" className="relative py-24 md:py-32">
      <div className="max-w-[1400px] mx-auto px-6 md:px-10">
        <SectionHeading
          eyebrow="Method"
          title="From objective to output."
          subtitle="A disciplined four-stage loop keeps the agent focused, transparent, and correctable."
        />

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-px bg-white/[0.06] rounded-2xl overflow-hidden border border-white/[0.06]">
          {HOW_STEPS.map((s, i) => (
            <motion.div
              key={s.n}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.6, delay: i * 0.08 }}
              className="group relative bg-[#080809] p-8 min-h-[240px] hover:bg-[#0c0c0e] transition-colors"
              data-testid={`how-step-${s.n}`}
            >
              <div className="flex items-baseline justify-between">
                <span className="font-mono text-[11px] tracking-widest text-white/40">
                  STEP · {s.n}
                </span>
                <span className="font-serif-italic text-4xl text-white/10 group-hover:text-white/25 transition-colors">
                  {s.n}
                </span>
              </div>
              <div className="mt-14">
                <h3 className="text-xl tracking-tight text-white">{s.title}</h3>
                <p className="mt-2.5 text-sm text-white/50 leading-relaxed">{s.body}</p>
              </div>
              <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
