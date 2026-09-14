import json
import os
from datetime import datetime, timezone

from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, Text, create_engine
from sqlalchemy.orm import declarative_base, relationship, sessionmaker

DATABASE_URL = os.environ.get(
    "DATABASE_URL",
    "postgresql://orchestr:hackathon_secret@localhost:5432/orchestr_db",
)

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(bind=engine, autoflush=False)
Base = declarative_base()


def utcnow():
    return datetime.now(timezone.utc)


class Incident(Base):
    __tablename__ = "incidents"

    id = Column(String, primary_key=True)
    title = Column(String, nullable=False)
    status = Column(String, nullable=False, default="investigating")
    context = Column(Text, default="")
    pr_url = Column(String, default="")
    calendar_link = Column(String, default="")
    created_at = Column(DateTime(timezone=True), default=utcnow)
    updated_at = Column(DateTime(timezone=True), default=utcnow, onupdate=utcnow)

    ledger = relationship(
        "ActionLedger",
        back_populates="incident",
        order_by="ActionLedger.id",
        cascade="all, delete-orphan",
    )


class ActionLedger(Base):
    __tablename__ = "action_ledger"

    id = Column(Integer, primary_key=True, autoincrement=True)
    incident_id = Column(String, ForeignKey("incidents.id"), nullable=False, index=True)
    step_name = Column(String, nullable=False)
    message = Column(Text, nullable=False)
    status = Column(String, nullable=False)
    timestamp = Column(DateTime(timezone=True), default=utcnow)

    incident = relationship("Incident", back_populates="ledger")


class WatchedIssue(Base):
    """A GitHub issue the watchdog has observed in the target repo."""

    __tablename__ = "watched_issues"

    id = Column(Integer, primary_key=True, autoincrement=True)
    repo = Column(String, nullable=False, default="")
    issue_number = Column(Integer, nullable=False)
    title = Column(String, default="")
    author_login = Column(String, default="")
    labels = Column(String, default="")
    body = Column(Text, default="")
    category = Column(String, default="unclassified")
    severity = Column(String, default="low")
    status = Column(String, default="new")  # new|processing|handled|promoted|resolved|failed
    pr_url = Column(String, default="")
    reply = Column(Text, default="")
    incident_id = Column(String, default="")
    # --- continuous-chat cursors (per-issue comment thread) ---
    last_human_comment_id = Column(BigInteger, default=0)   # newest human comment we have replied to
    our_last_comment_id = Column(BigInteger, default=0)     # newest comment of our own on this issue
    created_at = Column(DateTime(timezone=True), default=utcnow)
    updated_at = Column(DateTime(timezone=True), default=utcnow, onupdate=utcnow)

    __table_args__ = ({"sqlite_autoincrement": True},)


class UserProfile(Base):
    """Adapted communication profile derived from a GitHub login's public texts."""

    __tablename__ = "user_profiles"

    user_id = Column(String, primary_key=True)
    profile_json = Column(Text, nullable=False, default="{}")
    updated_at = Column(DateTime(timezone=True), default=utcnow, onupdate=utcnow)


class ScanState(Base):
    """Watchdog cursor: which issue numbers this repo has already seen."""

    __tablename__ = "scan_state"

    repo = Column(String, primary_key=True)
    last_scan_at = Column(DateTime(timezone=True), default=utcnow)
    processed_issue_numbers = Column(Text, default="[]")


def init_db():
    Base.metadata.create_all(bind=engine)


def incident_to_dict(inc: Incident) -> dict:
    return {
        "id": inc.id,
        "title": inc.title,
        "status": inc.status,
        "created_at": inc.created_at.isoformat() if inc.created_at else None,
        "context": inc.context or "",
        "pr_url": inc.pr_url or "",
        "calendar_link": inc.calendar_link or "",
        "ledger": [step_to_dict(s) for s in inc.ledger],
    }


def step_to_dict(s: ActionLedger) -> dict:
    return {
        "step": s.step_name,
        "message": s.message,
        "status": s.status,
        "timestamp": s.timestamp.isoformat() if s.timestamp else None,
    }


def issue_to_dict(issue, incident=None) -> dict:
    try:
        labels = json.loads(issue.labels) if issue.labels else []
    except Exception:
        labels = []
    out = {
        "id": issue.id,
        "issue_number": issue.issue_number,
        "repo": issue.repo,
        "title": issue.title,
        "author_login": issue.author_login,
        "labels": labels,
        "category": issue.category,
        "severity": issue.severity,
        "status": issue.status,
        "pr_url": issue.pr_url,
        "reply": issue.reply,
        "incident_id": issue.incident_id,
        "incident_status": incident.status if incident else "",
        "incident_pr_url": incident.pr_url if incident else "",
        "incident_calendar_link": incident.calendar_link if incident else "",
        "created_at": issue.created_at.isoformat() if issue.created_at else None,
        "updated_at": issue.updated_at.isoformat() if issue.updated_at else None,
    }
    return out


def profile_to_dict(profile) -> dict:
    try:
        body = json.loads(profile.profile_json) if profile.profile_json else {}
    except Exception:
        body = {}
    return {**body, "updated_at": profile.updated_at.isoformat() if profile.updated_at else None}


def scan_state_to_dict(state) -> dict:
    try:
        processed = [int(n) for n in json.loads(state.processed_issue_numbers or "[]")]
    except Exception:
        processed = []
    return {
        "repo": state.repo,
        "last_scan_at": state.last_scan_at.isoformat() if state.last_scan_at else None,
        "processed": sorted(processed),
    }