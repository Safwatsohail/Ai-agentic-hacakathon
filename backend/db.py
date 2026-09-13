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