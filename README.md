# <div align="center">⚡ ORCHESTR ⚡</div>
video link :https://drive.google.com/file/d/1OkdZCTHvAZ8zdsVipyklWh1rbPtOERN7/view?usp=drivesdk
<div align="center">

**One agent. Three apps. Every action verified. Goes further and fixes the broken code itself.**

[![Live Demo](https://img.shields.io/badge/LIVE-orchestr.mhd64.dev-6f42c1?style=for-the-badge&logo=data%3Aimage%2Fsvg%2Bxml)](https://orchestr.mhd64.dev)
<br>
[![Backend Tests](https://img.shields.io/badge/backend_tests-9_passed-brightgreen?style=flat-square)](https://github.com)
[![Sandbox Tests](https://img.shields.io/badge/sandbox_tests-25_passed-brightgreen?style=flat-square)](https://github.com)
[![Stack](https://img.shields.io/badge/stack-Docker_Compose-blue?style=flat-square)](https://github.com)
[![License](https://img.shields.io/badge/license-MIT-blue?style=flat-square)](https://github.com)

**Discord · GitHub · Google Calendar — working as one team, out loud.**

</div>

---

## 🎯 The Pitch

When production breaks, the signal is scattered: a Discord ping, a bad commit
in GitHub, a review meeting that never got booked. Teams burn 30+ minutes
just *reading* across apps before anyone *does* anything.

**Orchestr** is an AI agent that lives inside those same three apps and works
them the way a great engineer does — hands-on, chatty, and accountable:

1. You mention **@Orchestr** in the incidents channel (or a new GitHub issue
   appears) — Orchestr takes it.
2. It **investigates the real commit history**, finds the exact faulty change,
   **writes a real regression test**, runs it, and **opens a fix Pull Request**
   that only succeeds when the test genuinely passes.
3. It **books the "Incident Review" meeting on Google Calendar early** — sized
   to the complexity of the fix — and posts the link in the channel *before*
   the work finishes.
4. Along the way it **posts friendly, developer-style progress updates** on the
   channel, and every action lands in an **auditable live ledger** on the
   dashboard.
5. A **self-healing watchdog** scans GitHub issues every 60 seconds, triages
   them, **auto-fixes bugs**, and answers questions in the reporter's voice.

> **Unlike a chatbot, Orchestr changes real application state and then re-queries
> the apps to prove it. No action is trusted on faith.**

---

## 🚀 What It Actually Does (live, right now)

| Capability | What happens | Status |
| :--- | :--- | :--- |
| **Discord intake** | `@Orchestr` ping in the incidents channel → snapshots the last 10 messages as context → incident created | ✅ live |
| **GitHub root-cause** | Reads recent commits, opens the suspicious diff, pinpoints the bug with file:line proof | ✅ live |
| **Auto-fix PRs** | Writes a real regression test, executes it locally; PR is only opened on green, with emoji Markdown root-cause writeup | ✅ live |
| **Complexity-based calendar** | Books a **public "Incident Review"** event *right after diagnosis* — 30/60/120/180 min windows sized by simple→critical | ✅ live |
| **Progress updates** | Posts upbeat dev-style status on the channel as it works (👀 → 🔍 → 🛠 → ✅), then a resolution recap | ✅ live |
| **GitHub issues watchdog** | Polls open issues every 60s; classifies (bug / incident / enhancement / question × 4 severities); **bugs auto-promote to the fix pipeline** | ✅ live |
| **Personalized replies** | Builds a reporter profile from their public texts and replies in their style — with a **validation gate** that blocks leaks and non-actionable text | ✅ live |
| **Live dashboard** | Overview, streaming Runs ledger (SSE), Issues panel, Integrations — served over HTTPS | ✅ live |

---

## 🔁 End-to-End Incident Flow

```
        Discord                 Orchestr (ADK sandbox)            GitHub / Calendar / Discord
   ┌──────────────┐     ┌────────────────────────────────┐    ┌──────────────────────────────┐
   │ @Orchestr    │────►│ 1. investigate commits          │───►│ read commit history (GitHub) │
   │ "checkout is  │     │ 2. read_commit_diff(sha)        │───►│ root cause: files + lines    │
   │  DOWN"        │     │ 3. 👀 "on it..." (progress)     │───►│ post to #incidents           │
   │              │     │ 4. size complexity (diff)       │    │                              │
   │              │     │ 5. 📅 BOOK REVIEW WINDOW EARLY  │───►│ PUBLIC GOOGLE CALENDAR EVENT │
   │              │     │    → 60 min, +15 min, link       │    │                              │
   │              │     │ 6. 📅 link posted on channel     │───►│ "fix window booked"          │
   │              │     │ 7. write regression test         │    │                              │
   │              │     │ 8. create_fix_pr()               │───►│ FIX PR + REAL TEST RESULTS   │
   │              │     │ 9. 🛠 PR link posted             │───►│ post to #incidents           │
   │              │     │10. ✅ resolved recap            │───►│ dev-channel final summary     │
   └──────────────┘     └────────────────────────────────┘    └──────────────────────────────┘
        ▲                                                                              │
        └──────────────  every step verified & written to the live ledger  ◄───────────┘
```

The **GitHub issues watchdog** runs the same human loop on a schedule — no ping
needed:

```
 every 60s ──► open issues ──► classifier (category × severity)
                  │
                  ├── bug / incident ──► promote ──► full fix pipeline (PR + calendar + codes)
                  └── question / enhancement ──► profile-aware, validated reply posted to the issue
```

---

## 🧠 How It Thinks & Stays Honest

### Closed-loop verification

```
   OBSERVE → REASON → PLAN → EXECUTE → READ BACK → COMPARE → [ VERIFIED | RETRY ]
```

A `200 OK` is **never** the proof. After every external change Orchestr
re-queries the app and compares the actual state to the intended state, then
marks the incident `verified` in the ledger.

### Reply validation gate

Issues replies pass a hard validator before touching GitHub: internal terms
(system prompt, agent internals) are **blocked**, every reply must be
**actionable** (steps / repro / fix plan — not fluff), and length is capped.
Invalid output falls back to a safe template. The profile system adapts tone,
verbosity and emoji to each reporter instead of using one canned voice.

### Knowing when NOT to act

Ambiguous report ("*checkout feels sluggish*") → no matching commit, spike or
open issue → **Orchestr refuses to escalate** and explains the missing evidence
instead of spamming channels and calendars.

### Secrets by design

`.env` and `google_credentials.json` are gitignored and **never** reach the
repo; the bot authenticates internally via tokens and a Google service account
that only exposes the dedicated public review calendar.

---

## 🏗 Architecture

```
┌──────────────────────────────────────────────────────────────────────────┐
│                     https://orchestr.mhd64.dev (Caddy, TLS)              │
│   ┌────────────┐   ┌───────────────────────────┐   ┌───────────────────┐ │
│   │  React     │   │  FastAPI backend :8000      │   │  ADK sandbox      │ │
│   │  dashboard │──►│  REST + SSE (live ledger)   │──►│  Gemini agent     │ │
│   │ (craco,    │   │  Discord bot (intakes)      │   │  Function tools   │ │
│   │  tailwind) │   │  Postgres via SQLAlchemy    │◄──│  └ github_tools   │ │
│   └────────────┘   └───────────────────────────┘   │  └ calendar_tools │ │
│              │          │  ▲                       │  └ issue_watch      │ │
└──────────────┼──────────┼──┼───────────────────────┴───────────────────┘ │
                ▼          ▼  └── Discord ── GitHub ── Google Calendar (real apps)
             Postgres     Caddy reverse proxy (build/ static + /api/*)
```

| Layer | Tech |
| :--- | :--- |
| Frontend | React (CRA + craco, Tailwind, framer-motion, lucide), SSE live ledger |
| Backend | FastAPI, Discord.py bot, SQLAlchemy + PostgreSQL, pydantic |
| Agent | Google Agent Development Kit (ADK), Gemini, `FunctionTool` sandbox |
| Tooling | `gh` CLI, Google Calendar v3 API, public ACL calendar |
| Deploy | Docker Compose, Caddy HTTPS, multistage images, tests in CI-friendly `tests/` |

---

## 📁 Repository Structure

```text
orchestr/
├── backend/            FastAPI + Discord bot + Postgres + REST/SSE APIs
│   ├── main.py         routes: incidents, issues, scan-state, profiles, announce
│   ├── db.py           models: incidents, ledger, watched_issues, user_profiles, scan_state
│   └── tests/          9 automated API tests (pytest)
├── sandbox/            Google ADK agent + tools (the "hands")
│   ├── agent.py        incident happy-path (progress updates, early calendar)
│   ├── github_tools.py Git/GitHub + issue tools (list/get/comment/labels)
│   ├── calendar_tools.py   complexity → fix-window scheduling
│   ├── issue_watch.py     60s watchdog (triage/promote/reply)
│   ├── issue_classifier.py personalizer.py response_validator.py reply_builder.py
│   └── tests/          25 automated tests (pytest)
├── src/                React dashboard (Overview, Runs Log, Issues, Integrations)
├── deploy/             docker-compose.yml, .env.example, Caddy, README
├── docs/               API spec & planning docs
└── build/              production bundle (served by Caddy)
```

---

## 🧪 Reliability Test Suite

| Suite | Covers | Result |
| :--- | :--- | :--- |
| **sandbox 25 tests** | issue classification, profile analysis, reply validation, complexity → fix-window mapping (all levels, overrides, edge-clamps) | ✅ |
| **backend 9 tests** | issues API, promote idempotency, scan-state merge, profiles, **announce → channel + ledger**, Discord-offline survival, unique incident ids | ✅ |

Run them yourself:

```bash
docker compose -f deploy/docker-compose.yml up -d --build backend sandbox
docker compose -f deploy/docker-compose.yml exec sandbox python -m pytest tests -q     # 25 passed
docker compose -f deploy/docker-compose.yml exec backend bash -c "cd /app && python -m pytest tests -q"  # 9 passed
```

---

## 🚀 Run It Locally

```bash
cp deploy/.env.example .env      # Discord/GitHub/Gemini tokens + Google service key
docker compose -f deploy/docker-compose.yml up -d --build
npm install && npm start         # dashboard on :3000, proxies /api/*
```

Live in production at **https://orchestr.mhd64.dev** — bash-style the bot in the
incidents channel, or open any issue in the tracked repo, and watch it flow.

> Watch a live incident: `@Orchestr` in the incidents channel, or
> `https://github.com/mhd64real/checkout-service/issues` → open a bug.

---

## 🎬 2-Minute Judge Demo Script

```
0:00  PROBLEM — a Discord mention: "checkout total is wrong"
0:10  INTAKE — Orchestr snapshots the channel + creates the incident
0:30  INVESTIGATION — commit history is read live, faulty diff shown
0:45  CALENDAR FIRST — "Incident Review" booked, sized to complexity, link posted
1:05  FIX — regression test runs green, fix PR opens
1:30  WATCHDOG — open a second bug; see it self-promote and reply in-person
1:45  LEDGER — dashboard Runs Log streams every verified step end to end
1:55  CLOSE — "no action was trusted on faith — that's the difference."
```

---

## 🏆 Hackathon Alignment

* **Technical execution** — real multi-app state changes (Discord/GitHub/Calendar) driven by one ADK agent, plus a self-healing issue watchdog.
* **Reliability** — every action read-backed and logged; 34 automated tests; validation gate; refusal logic.
* **Usefulness** — collapses "read 3 apps then act" into a single @mention that also *does* the fix.
* **Originality** — agent-to-agent personality, early complexity-based scheduling, self-healing issues instead of canned chatbot answers.
* **Demo clarity** — the progress updates and live ledger make the agent's work visible in the demo itself.

---

<div align="center">

**Orchestr** • *It doesn't just know about the problem — it fixes it, proves it, and tells the team how.*

</div>
