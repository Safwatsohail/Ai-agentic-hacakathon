import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowUpRight, Play } from "lucide-react";

export default function FinalCTA() {
  return (
    <section id="cta" className="relative py-32 md:py-40 overflow-hidden">
      <div className="absolute inset-0 bg-grid opacity-40 radial-fade pointer-events-none" />
      <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-[420px] bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.08),transparent_60%)] pointer-events-none" />

      <div className="relative max-w-[1100px] mx-auto px-6 md:px-10 text-center">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="font-mono text-[11px] tracking-widest uppercase text-white/45 mb-6"
        >
          <span className="inline-block h-[1px] w-6 bg-white/40 align-middle mr-3" />
          The invitation
        </motion.div>
        <motion.h2
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="text-5xl md:text-6xl lg:text-[80px] leading-[1.02] tracking-[-0.035em] font-medium text-white"
        >
          Give your AI a <span className="font-serif-italic">system</span>{" "}
          to think with.
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="mt-6 max-w-2xl mx-auto text-white/55 leading-relaxed"
        >
          Explore the agent, watch it orchestrate tools in real time, and see how
          the system turns complex tasks into reliable execution.
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="mt-10 flex flex-wrap items-center justify-center gap-3"
        >
          <a
            href="#try"
            data-testid="cta-try"
            className="inline-flex items-center gap-2 pl-5 pr-2 py-2.5 rounded-full bg-white text-black text-[13px] font-medium hover:bg-white/90 transition-all"
          >
            Try the Agent
            <span className="h-7 w-7 rounded-full bg-black/10 grid place-items-center">
              <Play className="h-3.5 w-3.5 fill-current" />
            </span>
          </a>
          <Link
            to="/dashboard"
            data-testid="cta-dashboard"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-white/12 text-white/85 text-[13px] hover:bg-white/[0.04] hover:border-white/25 transition-all"
          >
            Explore Dashboard
            <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
