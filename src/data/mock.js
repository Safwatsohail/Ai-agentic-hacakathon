// Central mock data for the platform. Frontend-only, no backend.

export const AGENT_NAME = "Vernex";

export const NAV_ITEMS = [
  { label: "Product", href: "#product" },
  { label: "How it works", href: "#how" },
  { label: "Reliability", href: "#reliability" },
  { label: "Integrations", href: "#integrations" },
  { label: "Tests", href: "#tests" },
];

export const SUGGESTED_TASKS = [
  "@Orchestr handle this production incident",
  "@Orchestr summarize the recent #incidents",
  "@Orchestr schedule an incident review",
];

// The 6 canonical stages of the Orchestr Happy Path
export const EXECUTION_STAGES = [
  { id: "discord", label: "Investigate Discord", detail: "Read context in #incidents", ms: 420 },
  { id: "github_search", label: "Investigate GitHub", detail: "Search target repo commits", ms: 680 },
  { id: "plan", label: "Reason & Plan", detail: "Identify bug in diff", ms: 540 },
  { id: "github_pr", label: "Act: GitHub", detail: "Create PR with code fix", ms: 820 },
  { id: "calendar", label: "Act: Calendar", detail: "Schedule 'Incident Review'", ms: 450 },
  { id: "discord_report", label: "Report: Discord", detail: "Post PR & meeting link", ms: 380 },
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
  { n: "01", title: "Investigate", body: "The agent reads context from Discord and GitHub." },
  { n: "02", title: "Plan", body: "It identifies the root cause and drafts a strategy." },
  { n: "03", title: "Act", body: "It pushes a PR and schedules follow-ups autonomously." },
  { n: "04", title: "Report", body: "It verifies actions and loops you back in on Discord." },
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
