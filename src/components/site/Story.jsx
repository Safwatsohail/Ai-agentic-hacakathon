import { motion } from "framer-motion";

const BLOCKS = [
  {
    tag: "The problem",
    body: "Most LLM applications feel like black boxes. Chains fail silently, tools misbehave, and users are left guessing what happened. Agents need to be as transparent as any production system.",
  },
  {
    tag: "Our approach",
    body: "We separated reasoning from orchestration and made every step inspectable. Plans, tool calls, and validations are surfaced as first-class primitives you can observe, evaluate, and replay.",
  },
  {
    tag: "Why it matters",
    body: "When agents are trustworthy, they stop being demos and start being infrastructure. That's the shift we're building for.",
  },
];

export default function Story() {
  return (
    <section id="story" className="relative py-24 md:py-32">
      <div className="max-w-[1100px] mx-auto px-6 md:px-10">
        <div className="grid md:grid-cols-3 gap-10">
          {BLOCKS.map((b, i) => (
            <motion.div
              key={b.tag}
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: i * 0.1 }}
              data-testid={`story-${i}`}
            >
              <div className="font-mono text-[10px] tracking-widest uppercase text-white/40 mb-4">
                {String(i + 1).padStart(2, "0")} · {b.tag}
              </div>
              <p className="text-white/85 text-[17px] leading-[1.55] tracking-[-0.005em]">
                {b.body}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
