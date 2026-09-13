import { motion } from "framer-motion";
import { INTEGRATIONS } from "@/data/mock";
import { SectionHeading } from "@/components/site/TryAgent";
import { cn } from "@/lib/utils";
import { Plug } from "lucide-react";

export default function Integrations() {
  return (
    <section id="integrations" className="relative py-24 md:py-32">
      <div className="max-w-[1400px] mx-auto px-6 md:px-10">
        <SectionHeading
          eyebrow="Integrations"
          title="Connect the tools your agent needs."
          subtitle="12+ first-class integrations plus custom APIs. Each with typed access and permission scopes."
        />

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {INTEGRATIONS.map((i, idx) => (
            <motion.div
              key={i.name}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: idx * 0.03 }}
              className="group relative p-4 rounded-xl border border-white/[0.08] bg-[#0a0a0c] hover:border-white/25 hover:bg-[#0c0c0e] transition-all"
              data-testid={`integration-${i.name.toLowerCase().replace(/\s+/g, "-")}`}
            >
              <div className="flex items-start justify-between">
                <div className="h-9 w-9 rounded-md border border-white/10 bg-white/[0.04] grid place-items-center">
                  <span className="font-mono text-[11px] text-white/80">
                    {i.name.slice(0, 2).toUpperCase()}
                  </span>
                </div>
                <span
                  className={cn(
                    "flex items-center gap-1.5 font-mono text-[10px] tracking-widest uppercase",
                    i.status === "connected" ? "text-emerald-400" : "text-white/40",
                  )}
                >
                  <span
                    className={cn(
                      "h-1.5 w-1.5 rounded-full",
                      i.status === "connected" ? "bg-emerald-400" : "bg-white/25",
                    )}
                  />
                  {i.status}
                </span>
              </div>
              <div className="mt-4 text-white tracking-tight">{i.name}</div>
              <div className="mt-1 text-[11px] text-white/40 font-mono">
                last used · {i.used}
              </div>
              <div className="mt-4 pt-3 border-t border-white/[0.06] flex items-center justify-between">
                <span className="text-[11px] text-white/45 font-mono truncate">
                  {i.perms}
                </span>
                <button className="inline-flex items-center gap-1 text-[11px] text-white/70 hover:text-white transition-colors">
                  <Plug className="h-3 w-3" />
                  Manage
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
