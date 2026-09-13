import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, Github, ArrowUpRight } from "lucide-react";
import { NAV_ITEMS } from "@/data/mock";
import { cn } from "@/lib/utils";

export default function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();

  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 12);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);

  return (
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: [0.2, 0.8, 0.2, 1] }}
      className={cn(
        "fixed top-0 inset-x-0 z-50 transition-all duration-300",
        scrolled
          ? "backdrop-blur-xl bg-black/50 border-b border-white/[0.06]"
          : "bg-transparent",
      )}
      data-testid="site-nav"
    >
      <div className="max-w-[1400px] mx-auto px-6 md:px-10 h-16 flex items-center justify-between">
        <Link
          to="/"
          data-testid="nav-logo"
          className="flex items-center gap-2.5 group"
        >
          <img src="/logo.png" alt="Orchestr" className="h-6 w-auto object-contain" onError={(e) => e.target.style.display='none'} />
          <span className="hidden sm:inline text-[11px] font-mono text-white/40 tracking-widest">
            v0.9.2
          </span>
        </Link>

        <div className="hidden lg:flex items-center gap-1">
          {NAV_ITEMS.map((n) => (
            <a
              key={n.href}
              href={n.href}
              data-testid={`nav-${n.label.toLowerCase().replace(/\s+/g, "-")}`}
              className="px-3.5 py-2 text-[13px] text-white/60 hover:text-white transition-colors rounded-md"
            >
              {n.label}
            </a>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <a
            href="#docs"
            data-testid="nav-docs"
            className="hidden md:inline text-[13px] text-white/60 hover:text-white px-3 py-2 transition-colors"
          >
            Documentation
          </a>
          <a
            href="https://github.com"
            target="_blank"
            rel="noreferrer"
            data-testid="nav-github"
            className="hidden md:inline-flex h-9 w-9 items-center justify-center rounded-md border border-white/10 text-white/70 hover:text-white hover:border-white/25 transition-colors"
          >
            <Github className="h-4 w-4" />
          </a>
          <Link
            to={pathname === "/" ? "/dashboard" : "/"}
            data-testid="nav-cta"
            className="group relative inline-flex items-center gap-2 pl-4 pr-2 py-2 rounded-full bg-white text-black text-[13px] font-medium hover:bg-white/90 transition-all"
          >
            <span>{pathname === "/" ? "Try the Agent" : "Back to site"}</span>
            <span className="h-6 w-6 rounded-full bg-black/10 grid place-items-center">
              <ArrowUpRight className="h-3.5 w-3.5 -rotate-45 group-hover:rotate-0 transition-transform" />
            </span>
          </Link>
          <button
            aria-label="Menu"
            onClick={() => setOpen((v) => !v)}
            data-testid="nav-mobile-toggle"
            className="lg:hidden h-9 w-9 rounded-md border border-white/10 text-white/70 grid place-items-center"
          >
            {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="lg:hidden overflow-hidden border-t border-white/[0.06] bg-black/70 backdrop-blur-xl"
          >
            <div className="px-6 py-3 flex flex-col gap-1">
              {NAV_ITEMS.map((n) => (
                <a
                  key={n.href}
                  href={n.href}
                  onClick={() => setOpen(false)}
                  className="py-2.5 text-sm text-white/70 hover:text-white border-b border-white/[0.04]"
                >
                  {n.label}
                </a>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
}
