import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useRef } from "react";
import { Github, Calendar, MessageSquare, Loader2, X, Activity, Bug, Rocket, AlertTriangle, Sparkles, HelpCircle, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { api, apiStream } from "@/api";

const STATUS_STYLES = {
  verified: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20",
  investigating: "text-white border border-white/20",
  failed: "bg-red-500/10 text-red-400 border border-red-500/20",
};

const STATUS_LABEL = {
  verified: "Verified",
  investigating: "Running",
  failed: "Failed",
};

function fmtTime(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function RunsScreen() {
  const [runs, setRuns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRun, setSelectedRun] = useState(null);

  useEffect(() => {
    api("/api/incidents")
      .then(res => {
        if (!res.ok) throw new Error("Failed to fetch");
        return res.json();
      })
      .then(data => {
        setRuns([...data].sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0)));
        setLoading(false);
      })
      .catch(err => {
        console.error("Backend not ready:", err);
        setRuns([]);
        setLoading(false);
      });
  }, []);

  if (loading) return <div className="flex h-40 items-center justify-center text-white/50"><Loader2 className="h-5 w-5 animate-spin" /></div>;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 relative">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-medium tracking-tight text-white">Execution Logs</h2>
      </div>

      <div className="rounded-2xl border border-white/[0.08] bg-[#0a0a0c] overflow-hidden">
        {runs.length === 0 ? (
          <div className="p-8 text-center text-sm text-white/50">No incidents found. Run a demo incident to get started.</div>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="bg-white/[0.02] border-b border-white/[0.06] font-mono text-[10px] uppercase tracking-wider text-white/40">
              <tr>
                <th className="p-4 font-normal">Run ID</th>
                <th className="p-4 font-normal">Incident</th>
                <th className="p-4 font-normal">Status</th>
                <th className="p-4 font-normal">Fix PR</th>
                <th className="p-4 font-normal">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {runs.map(run => (
                <tr
                  key={run.id}
                  onClick={() => setSelectedRun(run)}
                  className="hover:bg-white/[0.02] transition-colors cursor-pointer"
                >
                  <td className="p-4 font-mono text-white/60">{run.id}</td>
                  <td className="p-4 text-white/80">{run.title}</td>
                  <td className="p-4">
                    <span className={cn(
                      "px-2 py-1 rounded-md text-[10px] font-mono uppercase tracking-widest",
                      STATUS_STYLES[run.status] || STATUS_STYLES.failed
                    )}>
                      {STATUS_LABEL[run.status] || run.status}
                    </span>
                  </td>
                  <td className="p-4">
                    {run.pr_url ? (
                      <a
                        href={run.pr_url}
                        target="_blank"
                        rel="noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="text-emerald-400/90 hover:text-emerald-300 font-mono text-xs underline underline-offset-4"
                      >
                        PR #{run.pr_url.split("/").pop()}
                      </a>
                    ) : (
                      <span className="text-white/25 text-xs">—</span>
                    )}
                  </td>
                  <td className="p-4 text-white/50 text-xs">{fmtTime(run.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Live SSE Viewer Overlay */}
      <AnimatePresence>
        {selectedRun && (
          <RunsDetail
            run={selectedRun}
            onClose={() => setSelectedRun(null)}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function RunsDetail({ run, onClose }) {
  const [logs, setLogs] = useState([]);
  const logEnd = useRef(null);

  useEffect(() => {
    let evtSource;
    let isMounted = true;

    api(`/api/incidents/${run.id}`)
      .then(res => {
        if (!res.ok) throw new Error("Failed to fetch incident details");
        return res.json();
      })
      .then(data => {
        if (!isMounted) return;

        // Seed the historical ledger, newest last
        if (data.ledger && Array.isArray(data.ledger)) {
          setLogs(data.ledger);
        }

        // Connect to the real SSE stream; the backend emits named "step_update" events
        evtSource = apiStream(`/api/incidents/${run.id}/stream`);

        evtSource.addEventListener("step_update", (event) => {
          try {
            const payload = JSON.parse(event.data);
            setLogs(prev => {
              const dup = prev.some(l => l.timestamp && payload.timestamp && l.timestamp === payload.timestamp);
              return dup ? prev : [...prev, payload];
            });
          } catch (e) {
            console.error("Failed to parse SSE", e);
          }
        });

        evtSource.onerror = () => {
          if (isMounted) {
            console.warn("SSE connection issue — the dashboard will retry automatically.");
          }
        };
      })
      .catch(err => {
        console.error("Error setting up run details:", err);
        if (isMounted) {
          setLogs([
            { step: "system", message: "Backend unreachable — check that the orchestr stack is running.", status: "failed", timestamp: new Date().toISOString() },
          ]);
        }
      });

    return () => {
      isMounted = false;
      if (evtSource) {
        evtSource.close();
      }
    };
  }, [run.id]);

  useEffect(() => {
    logEnd.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="absolute inset-0 bg-[#050506] z-10 flex flex-col rounded-2xl border border-white/[0.08]"
    >
      <div className="flex items-center justify-between p-4 border-b border-white/[0.06] bg-white/[0.02]">
        <div className="flex items-center gap-3">
          <button onClick={onClose} className="p-1.5 hover:bg-white/10 rounded-md transition-colors text-white/60">
            <X className="h-4 w-4" />
          </button>
          <div className="font-mono text-[11px] tracking-widest text-white/50 uppercase">
            Run Details · {run.id}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={cn("h-1.5 w-1.5 rounded-full dot-pulse", run.status === "verified" ? "bg-emerald-400" : run.status === "failed" ? "bg-red-400" : "bg-white/40")} />
          <span className="font-mono text-[10px] uppercase tracking-widest text-white/40">Live SSE · {STATUS_LABEL[run.status] || run.status}</span>
        </div>
      </div>

      <div className="flex-1 p-6 overflow-y-auto bg-black/40">
        <div className="space-y-4">
          {run.pr_url && (
            <div className="flex items-center justify-between p-3 rounded-lg border border-emerald-500/20 bg-emerald-500/5">
              <span className="font-mono text-[10px] text-emerald-400/80 uppercase tracking-widest">Fix Pull Request</span>
              <a href={run.pr_url} target="_blank" rel="noreferrer" className="font-mono text-[12px] text-emerald-400 hover:text-emerald-300 underline underline-offset-4">open PR ↗</a>
            </div>
          )}
          {run.calendar_link && (
            <div className="flex items-center justify-between p-3 rounded-lg border border-white/[0.06] bg-[#0a0a0c]">
              <span className="font-mono text-[10px] text-white/40 uppercase tracking-widest">Incident Review Meeting</span>
              <a href={run.calendar_link} target="_blank" rel="noreferrer" className="font-mono text-[12px] text-white/70 hover:text-white underline underline-offset-4">open calendar ↗</a>
            </div>
          )}
          {logs.map((l, i) => (
            <div key={l.timestamp || i} className="flex flex-col gap-1 p-3 rounded-lg border border-white/[0.04] bg-[#0a0a0c]">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] text-white/30 uppercase tracking-widest">{l.step}</span>
                <span className="font-mono text-[10px] text-white/20">{l.timestamp ? new Date(l.timestamp).toLocaleTimeString() : ""}</span>
              </div>
              <div className="flex items-center gap-2 font-mono text-[12px]">
                {l.status === "in_progress" || l.status === "pending" ? <Loader2 className="h-3 w-3 animate-spin text-white/40" /> : <Activity className={cn("h-3 w-3", l.status === "failed" ? "text-red-400" : "text-emerald-400")} />}
                <span className={l.status === "in_progress" || l.status === "pending" ? "text-white/70" : "text-white"}>{l.message}</span>
              </div>
            </div>
          ))}
          <div ref={logEnd} />
        </div>
      </div>
    </motion.div>
  );
}

const REAL_INTEGRATIONS = [
  { id: "discord", name: "Discord", scope: "incident intake & reporting · #incidents / #developers", status: "connected" },
  { id: "github", name: "GitHub", scope: "checkout-service · commits, diff & fix PRs", status: "connected" },
  { id: "calendar", name: "Google Calendar", scope: "Incident Review meeting scheduling", status: "connected" },
];

const ISSUE_STATUS_STYLES = {
  new: "bg-white/5 border border-white/15",
  processing: "text-amber-300 border border-amber-500/30 bg-amber-500/10",
  handled: "text-white/70 border border-white/10 bg-white/[0.03]",
  promoted: "text-sky-300 border border-sky-500/30 bg-sky-500/10",
  resolved: "text-emerald-400 border border-emerald-500/30 bg-emerald-500/10",
  failed: "text-red-400 border border-red-500/30 bg-red-500/10",
};

const CATEGORY_ICON = {
  bug: Bug,
  incident: AlertTriangle,
  enhancement: Sparkles,
  question: HelpCircle,
};

export function IssuesScreen() {
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    api("/api/issues")
      .then(res => (res.ok ? res.json() : []))
      .then(data => {
        setIssues([...data].sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0)));
        setLoading(false);
      })
      .catch(() => {
        setIssues([]);
        setLoading(false);
      });
  };

  useEffect(() => { load(); }, []);

  const promote = (issue) => {
    api(`/api/issues/${issue.issue_number}/promote`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({}) })
      .then(res => (res.ok ? res.json() : {}))
      .then(() => load());
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-medium tracking-tight text-white">GitHub Issues Watch</h2>
          <p className="text-xs text-white/40 mt-1 font-mono">
            {loading ? "Scanning…" : `${issues.length} issue${issues.length === 1 ? "" : "s"} tracked · polled every 60s`}
          </p>
        </div>
        <button onClick={load} className="text-xs text-white/60 hover:text-white px-3 py-1.5 rounded-md border border-white/10 transition-colors">
          Refresh
        </button>
      </div>

      <div className="rounded-2xl border border-white/[0.08] bg-[#0a0a0c] overflow-hidden">
        {loading ? (
          <div className="flex h-40 items-center justify-center text-white/50"><Loader2 className="h-5 w-5 animate-spin" /></div>
        ) : issues.length === 0 ? (
          <div className="p-8 text-center text-sm text-white/50">No issues watched yet. The watchdog starts tracking issues the moment one is opened on GitHub.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-white/[0.02] border-b border-white/[0.06] font-mono text-[10px] uppercase tracking-wider text-white/40">
                <tr>
                  <th className="p-4 font-normal">#</th>
                  <th className="p-4 font-normal">Issue</th>
                  <th className="p-4 font-normal">Type</th>
                  <th className="p-4 font-normal">Severity</th>
                  <th className="p-4 font-normal">Watch status</th>
                  <th className="p-4 font-normal">Fix PR</th>
                  <th className="p-4 font-normal">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {issues.map(issue => (
                  <tr key={issue.issue_number} className="hover:bg-white/[0.02] transition-colors">
                    <td className="p-4 font-mono text-white/60">
                      <a href={`https://github.com/${issue.repo || "…"}/issues/${issue.issue_number}`} target="_blank" rel="noreferrer" className="hover:text-white underline underline-offset-4">
                        #{issue.issue_number}
                      </a>
                    </td>
                    <td className="p-4">
                      <div className="text-white/85">{issue.title || "Untitled"}</div>
                      <div className="font-mono text-[10px] text-white/35 mt-1">@{issue.author_login} · {fmtTime(issue.created_at)}</div>
                    </td>
                    <td className="p-4">
                      {(() => {
                        const TypeIcon = CATEGORY_ICON[issue.category] || Info;
                        return (
                          <span className="inline-flex items-center gap-1.5">
                            <TypeIcon className="h-4 w-4 text-white/50" />
                            <span className="text-white/60 text-xs capitalize">{issue.category || "unclassified"}</span>
                          </span>
                        );
                      })()}
                    </td>
                    <td className="p-4">
                      <span className={cn(
                        "px-2 py-1 rounded-md text-[10px] font-mono uppercase tracking-widest",
                        issue.severity === "critical" ? "bg-red-500/10 text-red-400 border border-red-500/20" :
                        issue.severity === "high" ? "bg-orange-500/10 text-orange-400 border border-orange-500/20" :
                        issue.severity === "medium" ? "bg-amber-500/10 text-amber-300 border border-amber-500/20" :
                        "bg-white/[0.03] text-white/50 border border-white/10"
                      )}>
                        {issue.severity || "low"}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex flex-col gap-1">
                        <span className={cn("px-2 py-1 rounded-md text-[10px] font-mono uppercase tracking-widest", ISSUE_STATUS_STYLES[issue.status] || ISSUE_STATUS_STYLES.new)}>
                          {issue.status}
                        </span>
                        {issue.incident_id && (
                          <span className="font-mono text-[10px] text-sky-300/80">
                            {issue.incident_status === "verified" ? "✅ fixed" : issue.incident_status === "failed" ? "❌ pipeline failed" : `incident ${issue.incident_id}`}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="p-4">
                      {issue.pr_url || issue.incident_pr_url ? (
                        <a href={issue.pr_url || issue.incident_pr_url} target="_blank" rel="noreferrer" className="text-emerald-400/90 hover:text-emerald-300 font-mono text-xs underline underline-offset-4">
                          PR #{(issue.pr_url || issue.incident_pr_url).split("/").pop()}
                        </a>
                      ) : (
                        <span className="text-white/25 text-xs">—</span>
                      )}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        {!["promoted", "resolved", "failed"].includes(issue.status) && (
                          <button
                            onClick={() => promote(issue)}
                            className="inline-flex items-center gap-1.5 text-[11px] text-sky-300 hover:text-sky-200 px-2.5 py-1.5 rounded-md border border-sky-500/30 bg-sky-500/10 transition-colors"
                          >
                            <Rocket className="h-3 w-3" /> Fix
                          </button>
                        )}
                        {issue.reply && (
                          <span className="font-mono text-[10px] text-white/35">replied</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </motion.div>
  );
}

export function IntegrationsScreen() {
  const [integrations, setIntegrations] = useState(REAL_INTEGRATIONS);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-medium tracking-tight text-white">Integrations</h2>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {integrations.map(i => {
          const Icon = i.id === "github" ? Github : i.id === "discord" ? MessageSquare : Calendar;
          return (
            <div key={i.id} className="p-5 rounded-2xl border border-white/[0.08] bg-[#0a0a0c] flex flex-col justify-between h-40 hover:border-white/[0.2] transition-all">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg border border-white/[0.08] bg-black/40 grid place-items-center text-white/80">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-white">{i.name}</h3>
                    <p className="text-[11px] text-white/40 mt-1 font-mono">{i.scope}</p>
                  </div>
                </div>
                <span className={cn("h-2 w-2 rounded-full", i.status === 'connected' ? 'bg-emerald-400' : 'bg-white/20')} />
              </div>

              <div className={cn(
                "w-full py-2 rounded-md text-xs font-medium border text-center",
                "border-white/[0.08] text-emerald-400/90"
              )}>
                Connected
              </div>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}