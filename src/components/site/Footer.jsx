import { AGENT_NAME } from "@/data/mock";

const COLS = [
  { title: "Product", links: ["Overview", "Try the Agent", "Dashboard", "Integrations"] },
  { title: "Resources", links: ["Documentation", "Changelog", "System status", "Roadmap"] },
  { title: "Company", links: ["Team", "Contact", "Careers", "Press"] },
  { title: "Legal", links: ["Privacy", "Terms", "Security"] },
];

export default function Footer() {
  return (
    <footer className="relative border-t border-white/[0.06]">
      <div className="max-w-[1400px] mx-auto px-6 md:px-10 py-16">
        <div className="grid lg:grid-cols-6 gap-10">
          <div className="lg:col-span-2">
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-md border border-white/10 bg-white/[0.03] grid place-items-center">
                <div className="h-2 w-2 rounded-[2px] bg-white/85" />
              </div>
              <span className="text-white tracking-tight">{AGENT_NAME}</span>
            </div>
            <p className="mt-4 max-w-xs text-sm text-white/45 leading-relaxed">
              An operating system for autonomous agents. Reason, orchestrate, and
              validate — with visibility at every step.
            </p>
            <div className="mt-6 font-mono text-[10px] tracking-widest uppercase text-white/35">
              Hackathon 2026 · v0.9.2
            </div>
          </div>
          {COLS.map((c) => (
            <div key={c.title}>
              <div className="font-mono text-[10px] tracking-widest uppercase text-white/40 mb-3">
                {c.title}
              </div>
              <ul className="space-y-2">
                {c.links.map((l) => (
                  <li key={l}>
                    <a
                      href="#"
                      className="text-[13px] text-white/70 hover:text-white transition-colors"
                    >
                      {l}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-14 pt-6 border-t border-white/[0.06] flex flex-col md:flex-row items-start md:items-center justify-between gap-3 font-mono text-[11px] text-white/40">
          <span>© 2026 {AGENT_NAME} labs — All rights reserved.</span>
          <span className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 dot-pulse" />
            All systems operational
          </span>
        </div>
      </div>
    </footer>
  );
}
