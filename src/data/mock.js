// Central mock data for the platform. Frontend-only, no backend.

export const AGENT_NAME = "NEXUS";

export const NAV_ITEMS = [
  { label: "Product", href: "#product" },
  { label: "How it works", href: "#how" },
  { label: "Reliability", href: "#reliability" },
  { label: "Integrations", href: "#integrations" },
  { label: "Tests", href: "#tests" },
  { label: "Team", href: "#team" },
];

export const SUGGESTED_TASKS = [
  "Research this company and summarize its competitors",
  "Analyze this dataset and surface key anomalies",
  "Find relevant information across my connected apps",
  "Create a research report on GPU inference economics",
  "Determine the best approach to reduce agent latency",
];

// The 8 canonical stages the simulated agent walks through
export const EXECUTION_STAGES = [
  { id: "understand", label: "Understand task", detail: "Parse objective & constraints", ms: 320 },
  { id: "plan", label: "Plan", detail: "Draft execution strategy", ms: 480 },
  { id: "reason", label: "Reason", detail: "Chain of thought evaluation", ms: 640 },
  { id: "search", label: "Search", detail: "Web + connected sources", ms: 820 },
  { id: "tools", label: "Invoke tools", detail: "Route to specialized capabilities", ms: 720 },
  { id: "memory", label: "Recall memory", detail: "Retrieve prior context", ms: 380 },
  { id: "validate", label: "Validate", detail: "Verify output against constraints", ms: 540 },
  { id: "respond", label: "Respond", detail: "Compose final answer", ms: 460 },
];

export const INTEGRATIONS = [
  { name: "GitHub", used: "2 minutes ago", status: "connected", perms: "repo, issues" },
  { name: "Slack", used: "14 minutes ago", status: "connected", perms: "channels, dm" },
  { name: "Gmail", used: "1 hour ago", status: "connected", perms: "read, send" },
  { name: "Google Drive", used: "3 hours ago", status: "connected", perms: "read, write" },
  { name: "Notion", used: "yesterday", status: "connected", perms: "pages, dbs" },
  { name: "Discord", used: "—", status: "available", perms: "guilds, dm" },
  { name: "Linear", used: "22 minutes ago", status: "connected", perms: "issues, cycles" },
  { name: "Jira", used: "—", status: "available", perms: "projects" },
  { name: "PostgreSQL", used: "4 minutes ago", status: "connected", perms: "read-only" },
  { name: "Google Calendar", used: "8 minutes ago", status: "connected", perms: "events" },
  { name: "Web Search", used: "just now", status: "connected", perms: "public web" },
  { name: "Custom API", used: "—", status: "available", perms: "user defined" },
];

export const RELIABILITY_PILLARS = [
  {
    key: "observability",
    title: "Observability",
    body: "See every step of an agent's execution, from token to tool call.",
  },
  {
    key: "validation",
    title: "Validation",
    body: "Verify outputs against constraints before returning them.",
  },
  {
    key: "recovery",
    title: "Recovery",
    body: "Handle failed tool calls and execution errors gracefully.",
  },
  {
    key: "transparency",
    title: "Transparency",
    body: "Understand what the agent is doing, in real time.",
  },
];

export const HOW_STEPS = [
  { n: "01", title: "Understand", body: "The agent interprets the objective and its constraints." },
  { n: "02", title: "Plan", body: "It determines the optimal execution strategy." },
  { n: "03", title: "Orchestrate", body: "It selects and coordinates specialized capabilities." },
  { n: "04", title: "Validate", body: "It evaluates the result before returning it." },
];

export const TEST_SUITE = [
  { id: 1, name: "Research task", duration: 820 },
  { id: 2, name: "Multi-tool task", duration: 1100 },
  { id: 3, name: "Data extraction", duration: 640 },
  { id: 4, name: "Reasoning task", duration: 920 },
  { id: 5, name: "Failure recovery", duration: 780 },
  { id: 6, name: "Long-context task", duration: 1240 },
];

export const BENCHMARK = [
  { label: "Task Success", value: 98.4 },
  { label: "Tool Selection", value: 96.8 },
  { label: "Planning Accuracy", value: 94.2 },
  { label: "Validation Accuracy", value: 97.1 },
];

export const TEAM = [
  { name: "A. Vasquez", role: "Systems / Runtime", bio: "Previously distributed systems at scale." },
  { name: "R. Nakamura", role: "Agent Architecture", bio: "Worked on evaluation frameworks for LLMs." },
  { name: "M. Osei", role: "Design / Product", bio: "Interfaces for developer infrastructure." },
  { name: "S. Lindqvist", role: "Reliability", bio: "Observability for high-throughput systems." },
];

export const METRICS = {
  latencyAvgMs: 482,
  latencyP95Ms: 812,
  toolLatencyMs: 214,
  successRate: 98.7,
  errorRate: 0.6,
  activeRuns: 4,
  tasksCompleted: 1284,
  connectedApps: 12,
  tokensProcessed: 3_142_909,
  requestsPerMin: 128,
  activeSessions: 37,
};

// Small time series (12 points) for latency spark chart
export const LATENCY_SERIES = [
  520, 480, 502, 498, 460, 475, 468, 450, 482, 471, 465, 492,
];

export const RPM_SERIES = [
  90, 102, 110, 118, 122, 128, 134, 130, 128, 132, 141, 128,
];

export const LIVE_EVENTS = [
  { t: "22:41:02", label: "Agent initialized" },
  { t: "22:41:03", label: "Task classified" },
  { t: "22:41:03", label: "Planner selected" },
  { t: "22:41:04", label: "GitHub tool invoked" },
  { t: "22:41:05", label: "Retrieved 18 documents" },
  { t: "22:41:06", label: "Reasoning complete" },
  { t: "22:41:07", label: "Validation started" },
  { t: "22:41:08", label: "Response generated" },
];
