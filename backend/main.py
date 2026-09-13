import asyncio
import json
import os
import time

import discord
import uvicorn
from datetime import datetime
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy import select
from sse_starlette.sse import EventSourceResponse
from typing import List, Optional

from db import (
    ActionLedger,
    Incident,
    ScanState,
    SessionLocal,
    UserProfile,
    WatchedIssue,
    incident_to_dict,
    init_db,
    issue_to_dict,
    profile_to_dict,
    scan_state_to_dict,
    step_to_dict,
)

# Environment Variables
DISCORD_TOKEN = os.environ.get("DISCORD_BOT_TOKEN")
INCIDENT_CHANNEL_ID = int(os.environ.get("DISCORD_INCIDENT_CHANNEL_ID", 0))
DEV_CHANNEL_ID = int(os.environ.get("DISCORD_DEV_CHANNEL_ID", 0))
CORS_ORIGINS = [
    o.strip()
    for o in os.environ.get("CORS_ORIGINS", "http://localhost:3000").split(",")
    if o.strip()
]

app = FastAPI(title="Orchestr Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Discord Bot Setup ---
intents = discord.Intents.default()
intents.message_content = True
client = discord.Client(intents=intents)


@client.event
async def on_ready():
    print(f'Discord Bot Logged in as {client.user}')


@client.event
async def on_message(message):
    if message.author == client.user:
        return

    # Trigger: If the bot is mentioned in the incidents channel
    if client.user in message.mentions and message.channel.id == INCIDENT_CHANNEL_ID:
        db = SessionLocal()
        try:
            incident_id = _unique_incident_id(db)

            # Fetch last 10 messages for context
            history = [msg async for msg in message.channel.history(limit=10)]
            history.reverse()
            context = "\n".join([f"{m.author.name}: {m.content}" for m in history])

            db.add(
                Incident(
                    id=incident_id,
                    title=f"Incident reported by {message.author.name}",
                    status="investigating",
                    context=context,
                )
            )
            db.commit()
        finally:
            db.close()

        await message.reply(
            f"🔍 **Incident Initialized.** Tracking ID: `{incident_id}`\n"
            "Investigating context and handing off to Agent Sandbox..."
        )

        await add_ledger_step(incident_id, "discord_context", "Read past 10 messages for context", "verified")


# --- FastAPI Routes for Frontend ---


@app.get("/api/incidents")
def get_incidents():
    db = SessionLocal()
    try:
        rows = db.scalars(select(Incident).order_by(Incident.created_at.desc())).all()
        return [incident_to_dict(i) for i in rows]
    finally:
        db.close()


@app.get("/api/incidents/pending")
def get_pending_incidents():
    # Called by Sandbox Agent to find work
    db = SessionLocal()
    try:
        rows = db.scalars(
            select(Incident).where(Incident.status == "investigating")
        ).all()
        return [incident_to_dict(i) for i in rows]
    finally:
        db.close()


@app.get("/api/incidents/{incident_id}")
def get_incident(incident_id: str):
    db = SessionLocal()
    try:
        inc = db.get(Incident, incident_id)
        return incident_to_dict(inc) if inc else {}
    finally:
        db.close()


def _unique_incident_id(db) -> str:
    """Millisecond-resolution id that never collides with an existing incident."""
    while True:
        candidate = f"inc_{int(time.time() * 1000)}"
        if db.get(Incident, candidate) is None:
            return candidate
        time.sleep(0.002)


# --- Internal API for Sandbox Agent ---


class LedgerStep(BaseModel):
    step: str
    message: str
    status: str


@app.post("/api/incidents/{incident_id}/ledger")
async def update_ledger(incident_id: str, step: LedgerStep):
    await add_ledger_step(incident_id, step.step, step.message, step.status)
    return {"status": "ok"}


class CompleteRequest(BaseModel):
    pr_url: Optional[str] = None
    calendar_link: Optional[str] = None
    status: str = "verified"


@app.post("/api/incidents/{incident_id}/complete")
async def complete_incident(incident_id: str, body: CompleteRequest):
    db = SessionLocal()
    try:
        inc = db.get(Incident, incident_id)
        if inc:
            inc.status = body.status or "verified"
            inc.pr_url = body.pr_url or ""
            inc.calendar_link = body.calendar_link or ""
            db.commit()
    finally:
        db.close()

    # Notify developers channel only on a verified resolution
    channel = client.get_channel(DEV_CHANNEL_ID)
    if channel and body.status == "verified":
        parts = [f"✅ **Incident Resolved (`{incident_id}`)**"]
        if body.pr_url:
            parts.append(f"🔧 Fix PR: {body.pr_url}")
        if body.calendar_link:
            parts.append(f"📅 Review meeting: {body.calendar_link}")
        await channel.send("\n".join(parts))
    return {"status": "ok"}


class AnnounceRequest(BaseModel):
    message: str
    channel: str = "incident"


@app.post("/api/incidents/{incident_id}/announce")
async def announce(incident_id: str, body: AnnounceRequest):
    """Posts a progress update to the incidents channel (or dev channel).

    Called by the sandbox agent between steps so the team sees the fix
    happening. Best-effort: never fails the incident if Discord is down.
    """
    channel_id = DEV_CHANNEL_ID if body.channel == "dev" else INCIDENT_CHANNEL_ID
    text = body.message.strip()
    if text:
        try:
            # get_channel only knows cached guilds; partial messageable always works.
            channel = client.get_channel(channel_id) or client.get_partial_messageable(channel_id)
            if channel:
                await channel.send(text[:1900])
        except Exception as e:
            print(f"Discord announce failed: {e}")
        await add_ledger_step(incident_id, "discord_update", text, "in_progress")
    return {"status": "ok"}


async def add_ledger_step(incident_id, step_name, message, status):
    db = SessionLocal()
    try:
        db.add(
            ActionLedger(
                incident_id=incident_id,
                step_name=step_name,
                message=message,
                status=status,
            )
        )
        db.commit()
    finally:
        db.close()


# --- GitHub Issue Watchdog API ---


TARGET_REPO = os.environ.get("GITHUB_TARGET_REPO", "")


@app.get("/api/issues")
def list_issues(status: str = "", category: str = ""):
    """Watched GitHub issues (optionally filtered), joined with their incident."""
    db = SessionLocal()
    try:
        query = select(WatchedIssue).order_by(WatchedIssue.created_at.desc())
        if status:
            query = query.where(WatchedIssue.status == status)
        if category:
            query = query.where(WatchedIssue.category == category)
        rows = db.scalars(query).all()
        incidents = {i.id: i for i in db.scalars(select(Incident)).all()}
        return [issue_to_dict(row, incidents.get(row.incident_id)) for row in rows]
    finally:
        db.close()


@app.get("/api/issues/{number:int}")
def get_issue(number: int):
    db = SessionLocal()
    try:
        row = db.scalars(
            select(WatchedIssue).where(WatchedIssue.issue_number == number).limit(1)
        ).first()
        if not row:
            return {}
        incident = db.get(Incident, row.incident_id) if row.incident_id else None
        return issue_to_dict(row, incident)
    finally:
        db.close()


class IssueResult(BaseModel):
    category: Optional[str] = None
    severity: Optional[str] = None
    status: Optional[str] = None
    pr_url: Optional[str] = None
    reply: Optional[str] = None
    incident_id: Optional[str] = None
    title: Optional[str] = None
    author_login: Optional[str] = None
    repo: Optional[str] = None
    labels: Optional[List[str]] = None
    body: Optional[str] = None


@app.post("/api/issues/{number:int}/result")
async def issue_result(number: int, body: IssueResult):
    """The sandbox watchdog records what it did with an issue (idempotent upsert)."""
    db = SessionLocal()
    try:
        row = db.scalars(
            select(WatchedIssue).where(WatchedIssue.issue_number == number).limit(1)
        ).first()
        if not row:
            row = WatchedIssue(issue_number=number, repo=TARGET_REPO)
            db.add(row)
        if body.category:
            row.category = body.category
        if body.severity:
            row.severity = body.severity
        if body.status:
            row.status = body.status
        if body.pr_url:
            row.pr_url = body.pr_url
        if body.reply:
            row.reply = body.reply
        if body.incident_id:
            row.incident_id = body.incident_id
        if body.title:
            row.title = body.title
        if body.author_login:
            row.author_login = body.author_login
        if body.repo:
            row.repo = body.repo
        if body.labels is not None:
            row.labels = json.dumps(body.labels)
        if body.body:
            row.body = body.body
        db.commit()
        db.refresh(row)
        return issue_to_dict(row)
    finally:
        db.close()


class PromoteRequest(BaseModel):
    category: Optional[str] = None


@app.post("/api/issues/{number:int}/promote")
async def promote_issue(number: int, body: PromoteRequest):
    """Escalates a watched issue into the Orchestr incident pipeline.

    Idempotent: if this issue already has a live incident, that incident is
    returned instead of creating a second one.
    """
    db = SessionLocal()
    try:
        row = db.scalars(
            select(WatchedIssue).where(WatchedIssue.issue_number == number).limit(1)
        ).first()
        if row is None:
            row = WatchedIssue(issue_number=number, repo=TARGET_REPO)
            db.add(row)
            db.flush()

        # Reuse an existing (non-failed) incident when possible.
        if row.incident_id:
            existing = db.get(Incident, row.incident_id)
            if existing:
                row.status = "promoted"
                if body.category:
                    row.category = body.category
                db.commit()
                return {"incident_id": row.incident_id}

        incident_id = _unique_incident_id(db)
        title = row.title or f"GitHub issue #{number}"
        context = (
            f"Reported by @{row.author_login or 'unknown'} on GitHub issue #{number} "
            f"in {row.repo or TARGET_REPO}.\n\n"
            f"Title: {title}\n"
            f"Category: {body.category or row.category or 'unclassified'}\n\n"
            f"Reporter text:\n{row.body or ''}\n\n"
            "Investigate the target repository, identify the faulty behavior "
            "described, open a corrective pull request with a real test, then "
            "schedule the review meeting."
        )
        incident = Incident(id=incident_id, title=f"Incident from issue #{number}: {title}", status="investigating", context=context)
        db.add(incident)

        row.incident_id = incident_id
        row.status = "promoted"
        if body.category:
            row.category = body.category
        db.commit()
        await add_ledger_step(incident_id, "issue_promoted", f"Promoted GitHub issue #{number} to incident pipeline", "verified")
        return {"incident_id": incident_id}
    finally:
        db.close()


@app.get("/api/issues/scan-state")
def get_scan_state(repo: str = ""):
    db = SessionLocal()
    try:
        key = repo or TARGET_REPO
        state = db.get(ScanState, key)
        return scan_state_to_dict(state) if state else {"repo": key, "last_scan_at": None, "processed": []}
    finally:
        db.close()


class ScanStateUpdate(BaseModel):
    repo: Optional[str] = None
    last_scan_at: Optional[str] = None
    processed: Optional[List[int]] = None


@app.post("/api/issues/scan-state")
def update_scan_state(body: ScanStateUpdate):
    db = SessionLocal()
    try:
        key = body.repo or TARGET_REPO
        state = db.get(ScanState, key)
        if not state:
            state = ScanState(repo=key, processed_issue_numbers="[]")
            db.add(state)
        if body.last_scan_at:
            state.last_scan_at = datetime.fromisoformat(body.last_scan_at)
        if body.processed:
            current = set(int(n) for n in json.loads(state.processed_issue_numbers or "[]"))
            current.update(body.processed)
            state.processed_issue_numbers = json.dumps(sorted(current))
        db.commit()
        db.refresh(state)
        return scan_state_to_dict(state)
    finally:
        db.close()


@app.get("/api/users/{user_id}/profile")
def get_user_profile(user_id: str):
    db = SessionLocal()
    try:
        profile = db.get(UserProfile, user_id)
        return {"profile": profile_to_dict(profile) if profile else None}
    finally:
        db.close()


class ProfileUpdate(BaseModel):
    profile: dict


@app.post("/api/users/{user_id}/profile")
def update_user_profile(user_id: str, body: ProfileUpdate):
    db = SessionLocal()
    try:
        profile = db.get(UserProfile, user_id)
        if not profile:
            profile = UserProfile(user_id=user_id, profile_json="{}")
            db.add(profile)
        profile.profile_json = json.dumps(body.profile)
        db.commit()
        db.refresh(profile)
        return {"profile": profile_to_dict(profile)}
    finally:
        db.close()


# --- SSE Stream for Live Dashboard ---

@app.get("/api/incidents/{incident_id}/stream")
async def stream_incident(request: Request, incident_id: str):
    async def event_generator():
        last_id = 0
        while True:
            if await request.is_disconnected():
                break

            db = SessionLocal()
            try:
                rows = db.scalars(
                    select(ActionLedger)
                    .where(
                        ActionLedger.incident_id == incident_id,
                        ActionLedger.id > last_id,
                    )
                    .order_by(ActionLedger.id)
                ).all()
                for row in rows:
                    last_id = row.id
                    yield {
                        "event": "step_update",
                        "data": json.dumps(step_to_dict(row)),
                    }
            finally:
                db.close()

            await asyncio.sleep(1)

    return EventSourceResponse(event_generator())


# --- Application Lifecycle ---

@app.on_event("startup")
async def startup_event():
    init_db()
    asyncio.create_task(client.start(DISCORD_TOKEN))


if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000)