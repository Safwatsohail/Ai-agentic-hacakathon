# Orchestr - Ultimate Master Plan

This document outlines the end-to-end development phases for Orchestr to ensure a flawless hackathon execution.

**Progress:** ✅ Stages 1–6 completed and verified end-to-end (dress rehearsal on 2026-09-13). Remaining work is Stage 7 — team frontend integration.

## Stage 1: Infrastructure & Foundation ✅
**Goal:** Set up a robust, containerized environment that supports our APIs, the agent, and persistent state.
*   **1.1 Docker Compose Setup:** Define `docker-compose.yml` with three services:
    *   `db`: PostgreSQL container for storing incidents and the action ledger.
    *   `backend`: FastAPI service (Python 3.12) running the API, Discord bot, and handling state.
    *   `sandbox`: A secured container running the Google ADK agent with required CLI tools (`git`, `gh`).
*   **1.2 Database Schema (SQLAlchemy/Alembic):**
    *   `incidents` table (id, title, status, created_at, updated_at).
    *   `action_ledger` table (id, incident_id, step_name, description, status, timestamp).
    *   *Note: SQLAlchemy models live in `backend/db.py`; tables auto-created on startup (`init_db`). Alembic migrations are optional since schema is minimal.*
*   **1.3 Internal Communication:** Establish internal HTTP routes so the `sandbox` agent can send live progress updates to the `backend`.

## Stage 2: The Integrations Layer ✅
**Goal:** Build the raw functions that interact with the outside world.
*   **2.1 Discord Bot (Background Task):**
    *   Initialize `discord.py` inside the FastAPI lifecycle.
    *   Listen for `/<command>` or `@Orchestr` mentions.
    *   Implement function to fetch `X` past messages for context.
    *   Implement function to send messages to a specific `developers` channel.
*   **2.2 GitHub Interface:**
    *   Implement API/CLI wrapper to fetch latest commits on the main branch.
    *   Implement function to retrieve line-by-line diffs for a specific commit.
    *   Implement function to branch, commit a fix, and open a Pull Request.
*   **2.3 Google Calendar Integration:**
    *   Implement OAuth2 / Service Account logic to create a Google Calendar meeting with a specified title and time.

## Stage 3: The Google ADK Agent (The Brain) ✅
**Goal:** Connect the LLM to the integrations using Google ADK tools.
*   **3.1 Agent Definition:** Initialize the Google ADK `Agent` in the `sandbox` container (model `gemini-3.6-flash` — `gemini-2.0-flash` is retired).
*   **3.2 Tool Creation:** Wrap the Stage 2 integrations into Google ADK Tools:
    *   `get_discord_context()`
    *   `investigate_github_commits(repo_name)`
    *   `read_commit_diff(commit_sha)`
    *   `create_fix_pull_request(repo_name, file_changes, pr_title)`
    *   `notify_discord_devs(message)`
    *   `schedule_incident_review(summary, time)`
*   **3.3 The Core Loop:** Prompt the agent with the "Happy Path" instructions to execute these tools in the correct order when triggered.

## Stage 4: Execution Ledger & Streaming (The "Verification" UI) ✅
**Goal:** Expose the agent's internal progress to your teammate's frontend in real-time.
*   **4.1 Event Hooks:** Modify the ADK tools so that right before and right after they execute, they HTTP POST an event to the `backend` to record it in the Postgres `action_ledger`.
*   **4.2 SSE Streaming Endpoint:** Implement `GET /api/incidents/{id}/stream` using FastAPI's `EventSourceResponse` to push new database ledger rows directly to the frontend web client.

## Stage 5: End-to-End Testing & Demo Prep ✅
**Goal:** Ensure a flawless 2-minute demo.
*   **5.1 Seed Data:** Create a dummy GitHub repo with a bugged commit for the demo. *(Seeded: `mhd64real/checkout-service` — PROMO10 double-discount bug.)*
*   **5.2 Dry Run:** Trigger the bot in Discord -> Watch the agent read -> Watch the agent fix -> Watch the PR appear -> Watch the Calendar event populate -> Watch the Frontend Dashboard light up. *(E2E verified: agent found the bug, opened PR #1, booked the calendar event, posted to Discord.)*
*   **5.3 Freeze & Polish:** Lock in package versions, handle API timeouts gracefully, and ensure no network hiccups break the demo flow.

## Stage 6: Final Polish & Handoff ✅
**Goal:** Ship a reliable, stage-ready, documented project. Each item is summarized as the "say this" trigger for me to execute next.

*   **6.1 Harden the agent loop** — *trigger: "harden agent"* ✅
    Wrap the ADK `runner.run` in a timeout, retry transient failures once, and keep the poller alive if a run throws. A hung LLM call must never stall the pipeline mid-demo. Then re-verify a synthetic incident completes.
    *   *Done: 240s timeout via a thread executor (hung runs can't block the poller), 2-attempt cap per incident, `status` support on `/complete`, poller marks exhausted incidents `failed`. Happy path re-verified live (PR #2 + calendar event).*
*   **6.2 Polish the deployment** — *trigger: "polish deploy"* ✅
    Run containers as a non-root user, set `PYTHONDONTWRITEBYTECODE=1` (stops root-owned `__pycache__` litter in the mounted volumes), add `restart: unless-stopped`, and remove the obsolete `version:` line from `docker-compose.yml`. Reboot everything and confirm all three services come up clean.
    *   *Done: both images run as uid-1000 `orchestr`, no bytecode litter, restart policy added, `version:` removed. DB healthy, bot logged in, poller up, calendar creds verified as non-root.*
*   **6.3 Reset the demo repo** — *trigger: "clean repo"* ✅
    Leave `main` in the pristine bugged state, then close PR #1 and delete its branch so the stage demo starts from a clean slate. Confirm `commits=2`, one buggy top commit.
    *   *Done: PRs #1/#2 closed, test branches deleted, stale demo calendar events purged. `main` = 2 commits (`Initial` → `Add PROMO10 discount support`), only branch is `main`, 0 open PRs.*
*   **6.4 Initialize git & first commit** — *trigger: "git init"* ⏭️ skipped
    `git init` the project root with `.gitignore` respected. Make one clean initial commit capturing the verified working state (no `.env`, no credentials).
    *   *Skipped: an existing remote repo already covers this; the team pushes into it later.*
*   **6.5 Sync the documentation** — *trigger: "update docs"* ✅
    Mark this file accurately and make `UPDATED_DOC.md` / `API_SPEC.md` reflect what shipped (Postgres backend, ADK 2.x API, verified E2E flow).
    *   *Done: `API_SPEC.md` now documents the live contract (DB-persisted ledger, `timestamp` fields, internal agent routes, service-account calendar — no fake auth endpoint); `UPDATED_DOC.md` reflects Postgres, ADK runner, gemini-3.6-flash, hardened loop, non-root containers, and verified E2E.*
*   **6.6 Rotate leaked secrets** — *trigger: "rotate tokens"* ⏭️ skipped
    Discords/Gemini/GitHub tokens live in chat history and the committed-behind-the-scenes `.env`. Rotate each token via the respective dashboards, update `.env`, and run a final connectivity check for all three providers.
    *   *Skipped deliberately by the team (tokens rotated outside this project's checklist).*
*   **6.7 Dress rehearsal** — *trigger: "rehearse"* ✅
    Full final E2E: insert a synthetic incident -> agent fixes -> PR opens -> calendar event books -> Discord posts -> SSE streams -> incident verified. Freeze this as the demo script.
    *   *Done (inc_2026091303): PR #3 + calendar event + Discord `#developers` post + SSE replay of all 10 ledger steps, status `verified`. Rehearsal artifacts then re-cleaned — repo back to pristine 2-commit `main`, 0 open PRs, empty calendar.*

## Stage 7: Team Frontend — Connect, De-Bloat & Join ⏳ (Next — execute in this exact order)
**Goal:** Make the teammate's frontend (`frontend` branch of `Safwatsohail/Ai-agentic-hacakathon`, cloned locally at `/home/server/containers/Ai-agentic-hacakathon`) actually drive the live backend, strip the agent-generated bloat without touching the landing, and fold the orchestr backend into that repo. **Local edits only — no push.**

> Findings from studying the branch (93 files): the core dashboard screens exist and are good (Runs Log + SSE overlay), but ~40 of 45 `ui/*` primitives are unused, dev-tooling junk from the agent IDE is committed (`.emergent/recordings`, `plugins/health-check/`, `@emergentbase/*` craco wrappers), and the dashboard talks to **hallucinated endpoints** (`/api/metrics`, `/api/integrations`, `/api/auth/{id}`). The landing page uses `mock.js` legitimately — it stays.

*   **7.1 Wire the frontend to the live backend** — *trigger: "connect frontend"* ✅
    Fix the API contract mismatches found:
    *   **SSE is broken both sides.** Live wire check: our backend emits `data:` as a **Python dict repr** (`{'step': ...}` single quotes) — not JSON — because `sse-starlette` 2.0.0 stringifies the mapping. Fix the stream (`backend/main.py`) to `yield {"event": "step_update", "data": json.dumps(step_to_dict(row))}`. And the frontend listens on `evtSource.onmessage`, but the event is *named* `step_update` so the handler **never fires** — switch to `evtSource.addEventListener("step_update", ...)`.
    *   **Dashboard Overview** calls non-existent `GET /api/metrics` (falls back to "Disconnected"). Drive it from `GET /api/incidents` (counts, latest status).
    *   **Runs Log table** reads `run.task/dur/time`; real incidents expose `title/created_at/pr_url/calendar_link` (`created_at` from DB). Map fields + status enum (`investigating|verified|failed`).
    *   **Integrations** calls `GET /api/integrations` and `GET /api/auth/{id}` (don't exist) and lists Slack/Gmail/Notion/… Replace with the 3 real apps (Discord, GitHub, Google Calendar — all connected, status read from the running stack).
    *   **Base URL:** `.env`'s `REACT_APP_BACKEND_URL` points at a dead emergent preview URL and is unused in code. Add a real config (default `""` = same origin through CRA's existing `"proxy": "http://localhost:8000"`); add `CORSMiddleware` to the backend (env-driven origins) for when the UI is served cross-origin.
    *   *Done: backend SSE now emits valid JSON (`json.dumps`) + `CORSMiddleware` (env `CORS_ORIGINS`, default localhost:3000). Frontend: new `src/api.js` (`REACT_APP_API_BASE`/`apiStream`), Overview + Runs Log + Integrations all live on real endpoints, SSE listens on the named `step_update` event with JSON parse + dedupe, Run Log sorted newest-first. `created_at` got a server-side `DEFAULT NOW()` (raw `psql` inserts had NULLed it). Dev server on :3000 verified: compiles, serves, and the CRA proxy forwards both `/api/*` and the SSE stream to the live backend.*
*   **7.2 De-bloat the frontend — keep the landing** — *trigger: "debloat frontend"* ✅
    Remove only what is provably dead; **the landing's `components/site/*` + `mock.js` stay**:
    *   Only `button`, `sonner`, `label`, `dialog` of the `ui/*` primitives are imported — delete the other ~40 shadcn files (`accordion`…`tooltip`) and their unused Radix packages.
    *   Delete dead site component `Team.jsx` (never imported), all 3 files under `src/constants/testIds/`, `.emergent/` crash recordings, `plugins/health-check/`, and the `@emergentbase/overlay` / `@emergentbase/visual-edits` cræco wrapper + its dev-server hacks in `craco.config.js` (keep the `@` alias wiring). Replace `craco.config.js` with a minimal version.
    *   Trim `package.json` to what imports actually pull in (drop `swr`, `recharts`, `dayjs`, `cmdk`, `embla-carousel-react`, `input-otp`, `react-resizable-panels`, `vaul`, `next-themes`, `sonner` stays, etc.); keep one lockfile.
    *   Align the dashboard shell's brand ("Vernex" → "Orchestr") and drop placeholder v1.0.0/mock agent-status widget.
    *   *Done (pulled forward to unlock `npm install` — the `react-day-picker`↔`date-fns` peer conflict was itself bloat): killed 45 of 46 `ui/*` primitives (only `sonner` kept), `testIds/`, `use-toast`, dead `Team.jsx`, `.emergent/`, `plugins/health-check/`, `cra-template`; rewrote `craco.config.js` minimal (no emergent overlay/visual-edits, added wds `allowedHosts` fix), removed `components.json`, `yarn.lock`, and ~30 unused deps (all Radix, day-picker, date-fns, dayjs, recharts, swr, embla, input-otp, vaul, resizable-panels, cmdk, next-themes, react-hook-form, zod, axios, lodash, ajv, cva, dotenv…); simplified `sonner.jsx` (no next-themes). Brand aligned: `Orchestr` in dashboard shell, Nav, `<title>`, `AGENT_NAME. Install: 1351 pkgs clean, `npm run build` passes. Landing untouched.*
*   **7.3 Join the orchestr backend into the repo (local only)** — *trigger: "join backend"*
    Fold the running stack into `Ai-agentic-hacakathon` so one repo reproduces everything:
    *   Layout: `backend/` (FastAPI + `db.py` + Dockerfile), `sandbox/` (ADK agent + tools + Dockerfile), `deploy/` (`docker-compose.yml` + `.env.example` + README run instructions), `docs/` (`API_SPEC.md`, `UPDATED_DOC.md`, `PLAN.md`).
    *   `.gitignore`: mask `.env`, `google_credentials.json`, `__pycache__`, `.venv`, node build output. Ship `deploy/.env.example`, **never** real tokens.
    *   Work on a local branch off `frontend` (e.g. `platform`); **no push** until the team reviews.
*   **7.4 Full-stack test & demo verification** — *trigger: "test fullstack"*
    Prove the joined repo end-to-end:
    *   `npm install` + `npm start` (port 3000, proxy → running backend on :8000). Load `/dashboard` and `/dashboard/runs`.
    *   Insert a synthetic incident, confirm the Overview KPIs populate and the Runs Log streams live `step_update` events with a green verified ledger; then re-clean the repo/calendar like 6.3/6.7.
    *   `npm run build` succeeds after the trim (dead imports would fail it).
    *   Update this plan + frontend README to document run commands for both halves.