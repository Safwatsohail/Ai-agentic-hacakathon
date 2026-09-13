import { motion } from "framer-motion";
import { TEAM, AGENT_NAME } from "@/data/mock";
import { SectionHeading } from "@/components/site/TryAgent";

export default function Team() {
  return (
    <section id="team" className="relative py-24 md:py-32">
      <div className="max-w-[1400px] mx-auto px-6 md:px-10">
        <SectionHeading
          eyebrow="Team"
          title={`Built by the ${AGENT_NAME} team.`}
          subtitle="A small group focused on making agents that actually work."
        />

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {TEAM.map((m, i) => (
            <motion.div
              key={m.name}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.06 }}
              className="group relative p-5 rounded-xl border border-white/[0.08] bg-[#0a0a0c] hover:border-white/20 transition-all"
              data-testid={`team-${i}`}
            >
              <div className="aspect-square rounded-lg overflow-hidden relative bg-gradient-to-br from-white/[0.06] to-white/[0.01] border border-white/[0.06]">
                <div className="absolute inset-0 bg-grid-fine opacity-70" />
                <div className="absolute inset-0 grid place-items-center">
                  <div className="font-serif-italic text-5xl text-white/25 group-hover:text-white/50 transition-colors">
                    {m.name
                      .split(" ")
                      .map((s) => s[0])
                      .join("")
                      .replace(".", "")}
                  </div>
                </div>
                <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/60 to-transparent" />
              </div>
              <div className="mt-4">
                <div className="text-white tracking-tight">{m.name}</div>
                <div className="font-mono text-[10px] tracking-widest uppercase text-white/45 mt-0.5">
                  {m.role}
                </div>
                <p className="mt-2 text-sm text-white/50 leading-relaxed">{m.bio}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
