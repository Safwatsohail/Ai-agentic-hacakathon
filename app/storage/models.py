from __future__ import annotations

from datetime import datetime, timezone
from enum import Enum
from typing import Any

from pydantic import BaseModel, Field


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


class IssueStatus(str, Enum):
    OPEN = "open"
    CONSENT_PENDING = "consent_pending"
    RESPONDED = "responded"
    RESOLVED = "resolved"
    DECLINED = "declined"


class MessageCreate(BaseModel):
    message_id: str
    user_id: str
    channel_id: str
    content: str
    author_name: str | None = None
    created_at: datetime = Field(default_factory=utc_now)


class DiscordMessage(MessageCreate):
    stored_at: datetime = Field(default_factory=utc_now)


class IssueDetectionResult(BaseModel):
    is_issue: bool
    confidence: float = Field(ge=0, le=1)
    category: str | None = None
    reason: str


class IssueRecord(BaseModel):
    issue_id: str
    user_id: str
    channel_id: str
    message_id: str
    summary: str
    category: str
    status: IssueStatus = IssueStatus.OPEN
    created_at: datetime = Field(default_factory=utc_now)


class CommunicationStyle(BaseModel):
    formality: str = "unknown"
    verbosity: str = "unknown"
    emoji_usage: str = "unknown"


class UserCommunicationProfile(BaseModel):
    user_id: str
    style: CommunicationStyle = Field(default_factory=CommunicationStyle)
    preferences: list[str] = Field(default_factory=list)
    observed_patterns: list[str] = Field(default_factory=list)
    evidence_count: int = 0
    confidence: float = 0.0
    updated_at: datetime = Field(default_factory=utc_now)


class ContextBundle(BaseModel):
    issue: IssueRecord
    recent_messages: list[DiscordMessage] = Field(default_factory=list)
    relevant_history: list[DiscordMessage] = Field(default_factory=list)


class ResponseValidationResult(BaseModel):
    valid: bool
    reasons: list[str] = Field(default_factory=list)
    cleaned_response: str = ""


JsonDict = dict[str, Any]
