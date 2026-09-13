# Orchestr — Local Dev Stack

Runs the whole platform from this repo: Postgres, FastAPI backend (Discord bot + REST/SSE),
and the ADK agent sandbox. Uses the same `<project>/.env` file for secrets (gitignored).

## Prerequisites
* Docker with `docker compose` (v2).
* A Google service account key at the repo root named `google_credentials.json`
  (or point `GOOGLE_CREDENTIALS_PATH` at your own file). Scopes: Google Calendar API.
* Tokens/key in `.env` (see `.env.example`): `DISCORD_BOT_TOKEN`, `DISCORD_*_CHANNEL_ID`,
  `GEMINI_API_KEY`, `GITHUB_TOKEN`, `GITHUB_USERNAME`, `GITHUB_TARGET_REPO`, `GITHUB_PUSH_URL`.

## 1 · Start the stack
```bash
cp deploy/.env.example .env   # then fill in real values
docker compose -f deploy/docker-compose.yml up -d --build
docker compose -f deploy/docker-compose.yml ps
```
Services: `orchestr_db` (postgres), `orchestr_backend` (:8000), `orchestr_sandbox` (poller), and `orchestr_caddy` (HTTPS reverse proxy). Production build of the frontend is served from `<repo>/build/` (run `npm run build` first).

Wrap-up: `docker compose -f deploy/docker-compose.yml down`.

## Production (Caddy + HTTPS)
Live at **https://orchestr.mhd64.dev** — one origin for app + API:

| Type | Name | Value |
|---|---|---|
| A | `orchestr.mhd64.dev` | `2.29.21.52` |
| AAAA | `orchestr.mhd64.dev` | `2a01:4f9:c015:e6e1::1` |

* `deploy/Caddyfile` handles TLS (Let's Encrypt, HTTP-01 on port 80), serves the SPA (client-side routing → `index.html`), and reverse-proxies `/api/*` (incl. SSE, `flush_interval -1`) to the `backend` service.
* Ports: host `80`/`443` → caddy; `8000` → backend (internal). 
* Same origin → `REACT_APP_API_BASE` stays empty, no CORS needed.

## 2 · Start the frontend (separate terminal)
```bash
npm install
npm start        # http://localhost:3000 — proxies /api/* to :8000
```
Set `REACT_APP_API_BASE` only when serving the UI cross-origin (add that origin to
`CORS_ORIGINS` in `.env` and restart the backend).

## 3 · Trigger a demo incident
Insert a synthetic incident, and the sandbox poller picks it up within ~5s:

```bash
docker compose -f deploy/docker-compose.yml exec db psql -U orchestr -d orchestr_db \
  -c "INSERT INTO incidents (id,title,status,context)
      VALUES ('inc_demo','Checkout total wrong again','investigating',
      'mhd64real: total wrong again
sara: PROMO10 gives an extra discount
mhd64real: @Orchestr handle this production incident');"
```

Watch it live on the dashboard **Runs Log** (SSE), or via:
```bash
curl -N http://localhost:8000/api/incidents/inc_demo/stream
```

## Repository layout
```
backend/   FastAPI app (main.py, db.py) + Dockerfile
sandbox/   ADK agent (agent.py, github_tools.py, calendar_tools.py) + Dockerfile
deploy/    docker-compose.yml, .env.example
docs/      API_SPEC.md, UPDATED_DOC.md, plan.md
src/       React frontend (Vite-free CRA/craco)
```