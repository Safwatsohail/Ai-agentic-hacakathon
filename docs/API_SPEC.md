# Orchestr - Frontend & API Specification

> **Status:** Contract is live and matches the shipped FastAPI backend. Storage is PostgreSQL (see `backend/db.py`).

## 1. Frontend Pages Needed

For the hackathon demo, keep the UI minimal and focused on the "Live Action Ledger".

*   **Page 1: Incident Dashboard (Home)**
    *   A simple list of recent incidents.
    *   Shows Status: `investigating`, `verified`, `failed`.
*   **Page 2: Live Ledger View (The 2-Minute Demo Screen)**
    *   This is the money screen. When an incident is clicked, it shows a vertical timeline of actions as the agent performs them.
    *   Needs to visually show: `OBSERVE -> PLAN -> EXECUTE -> VERIFY`.
    *   Should show green checkmarks as actions are verified across Discord, GitHub, and Calendar.

---

## 2. API Routes (FastAPI)

The frontend will communicate with the FastAPI backend using these endpoints.

### A. Get All Incidents
*   **GET** `/api/incidents`
*   **Response:**
```json
[
  {
    "id": "inc_12345",
    "title": "Checkout is not working",
    "status": "verified",
    "created_at": "2026-09-13T18:00:00+00:00",
    "pr_url": "https://github.com/mhd64real/checkout-service/pull/1",
    "calendar_link": "https://www.google.com/calendar/event?eid=..."
  }
]
```

### B. Get Incident Details
*   **GET** `/api/incidents/{incident_id}`
*   **Response:** full incident incl. `context`, `ledger` (chronological), `pr_url`, `calendar_link`.
```json
{
  "id": "inc_12345",
  "title": "Checkout is not working",
  "status": "verified",
  "context": "mhd64real: checkout is broken...",
  "pr_url": "https://github.com/mhd64real/checkout-service/pull/1",
  "calendar_link": "https://www.google.com/calendar/event?eid=...",
  "ledger": [
    {
      "step": "github_read",
      "message": "Diff for commit d78541f retrieved",
      "status": "verified",
      "timestamp": "2026-09-13T18:00:05+00:00"
    }
  ]
}
```

### C. Live Action Stream (Server-Sent Events)
*   **GET** `/api/incidents/{incident_id}/stream`
*   **Description:** This is an SSE (Server-Sent Events) endpoint. The frontend should connect to this to receive live, real-time updates as the agent does its work. Events are replayed from the DB (duplicate-safe, ordered by ledger id).
*   **Stream Payloads (sent one by one as they happen):**
```json
{"event": "step_update", "data": {"step": "github_read", "message": "Investigating recent commits...", "status": "in_progress", "timestamp": "2026-09-13T18:00:03+00:00"}}
{"event": "step_update", "data": {"step": "github_read", "message": "Found problematic commit in checkout-service", "status": "verified", "timestamp": "2026-09-13T18:00:05+00:00"}}
{"event": "step_update", "data": {"step": "github_pr", "message": "Creating fix PR...", "status": "in_progress", "timestamp": "2026-09-13T18:00:06+00:00"}}
{"event": "step_update", "data": {"step": "github_pr", "message": "PR #42 created successfully", "status": "verified", "timestamp": "2026-09-13T18:00:08+00:00"}}
{"event": "step_update", "data": {"step": "calendar_schedule", "message": "Scheduled Incident Review meeting", "status": "verified", "timestamp": "2026-09-13T18:00:10+00:00"}}
```

## 3. Internal Routes (Sandbox Agent only — not for the frontend)
*   **GET** `/api/incidents/pending` — incidents in `investigating` state (incl. `context`) for the agent poller.
*   **POST** `/api/incidents/{incident_id}/ledger` — body `{step, message, status}`; appends a ledger row.
*   **POST** `/api/incidents/{incident_id}/complete` — body `{pr_url?, calendar_link?, status?}`. Sets final status (default `verified`) and, on verified only, posts the resolution to the Discord `#developers` channel.

## 4. Google Calendar Auth
No frontend auth endpoint is required. The backend schedules meetings via a Google **service account** (`google_credentials.json`, mounted into both containers), so no user OAuth/Supabase provider token is needed.
