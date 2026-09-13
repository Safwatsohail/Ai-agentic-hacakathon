import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useRef } from "react";
import { Github, Calendar, MessageSquare, Loader2, X, Activity } from "lucide-react";
import { cn } from "@/lib/utils";

export function RunsScreen() {
  const [runs, setRuns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRun, setSelectedRun] = useState(null);

  useEffect(() => {
    fetch('/api/incidents')
      .then(res => {
        if (!res.ok) throw new Error("Failed to fetch");
        return res.json();
      })
      .then(data => {
        setRuns(data);
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
          <div className="p-8 text-center text-sm text-white/50">No recent runs found.</div>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="bg-white/[0.02] border-b border-white/[0.06] font-mono text-[10px] uppercase tracking-wider text-white/40">
              <tr>
                <th className="p-4 font-normal">Run ID</th>
                <th className="p-4 font-normal">Incident</th>
                <th className="p-4 font-normal">Status</th>
                <th className="p-4 font-normal">Duration</th>
                <th className="p-4 font-normal">Time</th>
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
                  <td className="p-4 text-white/80">{run.task}</td>
                  <td className="p-4">
                    <span className={cn(
                      "px-2 py-1 rounded-md text-[10px] font-mono uppercase tracking-widest",
                      run.status === 'Success' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                      run.status === 'Running' ? 'text-white border border-white/20' :
                      'bg-red-500/10 text-red-400 border border-red-500/20'
                    )}>
                      {run.status}
                    </span>
                  </td>
                  <td className="p-5 font-mono text-white/60">{run.dur}</td>
                  <td className="p-5 text-white/50 text-xs">{run.time}</td>
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

    fetch(`/api/incidents/${run.id}`)
      .then(res => {
        if (!res.ok) throw new Error("Failed to fetch incident details");
        return res.json();
      })
      .then(data => {
        if (!isMounted) return;
        
        // Populate historical logs if they exist
        if (data.ledger && Array.isArray(data.ledger)) {
          setLogs(data.ledger);
        }

        // Connect to real SSE endpoint for live updates
        evtSource = new EventSource(`/api/incidents/${run.id}/stream`);
        
        evtSource.onmessage = (event) => {
          try {
            const payload = JSON.parse(event.data);
            if (payload.event === "step_update") {
              setLogs(prev => [...prev, {
                time: new Date().toLocaleTimeString(),
                step: payload.data.step,
                message: payload.data.message,
                status: payload.data.status
              }]);
            }
          } catch (e) {
            console.error("Failed to parse SSE", e);
          }
        };

        evtSource.onerror = () => {
          if (isMounted) {
            setLogs(prev => prev.length === 0 ? [
              { time: new Date().toLocaleTimeString(), step: "system", message: "Connecting to stream...", status: "pending" },
              { time: new Date().toLocaleTimeString(), step: "discord_read", message: "Investigating commits...", status: "in_progress" }
            ] : prev);
          }
          evtSource.close();
        };
      })
      .catch(err => {
        console.error("Error setting up run details:", err);
        // Fallback for UI if backend is completely down
        if (isMounted) {
          setLogs([
            { time: new Date().toLocaleTimeString(), step: "system", message: "Backend offline. Mocking stream...", status: "pending" },
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
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 dot-pulse" />
          <span className="font-mono text-[10px] uppercase tracking-widest text-white/40">Live SSE</span>
        </div>
      </div>

      <div className="flex-1 p-6 overflow-y-auto bg-black/40">
        <div className="space-y-4">
          {logs.map((l, i) => (
            <div key={i} className="flex flex-col gap-1 p-3 rounded-lg border border-white/[0.04] bg-[#0a0a0c]">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] text-white/30 uppercase tracking-widest">{l.step}</span>
                <span className="font-mono text-[10px] text-white/20">{l.time}</span>
              </div>
              <div className="flex items-center gap-2 font-mono text-[12px]">
                {l.status === 'in_progress' ? <Loader2 className="h-3 w-3 animate-spin text-white/40" /> : <Activity className="h-3 w-3 text-emerald-400" />}
                <span className={l.status === 'in_progress' ? "text-white/70" : "text-white"}>{l.message}</span>
              </div>
            </div>
          ))}
          <div ref={logEnd} />
        </div>
      </div>
    </motion.div>
  );
}

export function IntegrationsScreen() {
  const [integrations, setIntegrations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/integrations')
      .then(res => {
        if (!res.ok) throw new Error("Failed to fetch integrations");
        return res.json();
      })
      .then(data => {
        // Map icon strings to components if needed, or just use the data. 
        // For now, assume backend returns objects with id, name, status, scope
        setIntegrations(data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Backend not ready:", err);
        setIntegrations([]);
        setLoading(false);
      });
  }, []);

  const handleConnect = (id) => {
    // Redirect to OAuth endpoint
    window.location.href = `/api/auth/${id}`;
  };

  if (loading) return <div className="flex h-40 items-center justify-center text-white/50"><Loader2 className="h-5 w-5 animate-spin" /></div>;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-medium tracking-tight text-white">Integrations</h2>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {integrations.length === 0 ? (
          <div className="col-span-full p-8 text-center text-sm text-white/50 border border-white/[0.08] rounded-2xl bg-[#0a0a0c]">No integrations configured.</div>
        ) : (
          integrations.map(i => {
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
                
                <button 
                  onClick={() => handleConnect(i.id)}
                  className={cn(
                    "w-full py-2 rounded-md text-xs font-medium border transition-all",
                    i.status === 'connected' 
                      ? "border-white/[0.08] text-white/60 hover:bg-white/[0.03]" 
                      : "bg-white text-black border-transparent hover:bg-white/90"
                  )}
                >
                  {i.status === 'connected' ? 'Manage Connection' : 'Connect via OAuth'}
                </button>
              </div>
            );
          })
        )}
      </div>
    </motion.div>
  );
}
