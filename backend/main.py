import asyncio
import json
import os

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
    SessionLocal,
    incident_to_dict,
    init_db,
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
        incident_id = f"inc_{int(datetime.now().timestamp())}"

        # Fetch last 10 messages for context
        history = [msg async for msg in message.channel.history(limit=10)]
        history.reverse()
        context = "\n".join([f"{m.author.name}: {m.content}" for m in history])

        db = SessionLocal()
        try:
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