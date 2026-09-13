from __future__ import annotations

import csv
import json
import os
from pathlib import Path

from app.storage.models import DiscordMessage, IssueRecord, IssueStatus, UserCommunicationProfile


class CsvStore:
    """Small, dependency-free persistence layer for the MVP."""

    def __init__(self, data_dir: str | Path | None = None) -> None:
        self.data_dir = Path(data_dir or os.getenv("DATA_DIR", "data"))
        self.messages_path = self.data_dir / "messages.csv"
        self.issues_path = self.data_dir / "issues.csv"
        self.profiles_path = self.data_dir / "user_profiles.csv"

    def initialize(self) -> None:
        self.data_dir.mkdir(parents=True, exist_ok=True)
        self._ensure(self.messages_path, ["message_id", "user_id", "channel_id", "content", "author_name", "created_at", "stored_at"])
        self._ensure(self.issues_path, ["issue_id", "user_id", "channel_id", "message_id", "summary", "category", "status", "created_at"])
        self._ensure(self.profiles_path, ["user_id", "profile_json"])

    @staticmethod
    def _ensure(path: Path, fields: list[str]) -> None:
        if not path.exists():
            with path.open("w", newline="", encoding="utf-8") as handle:
                csv.DictWriter(handle, fieldnames=fields).writeheader()

    @staticmethod
    def _read(path: Path) -> list[dict[str, str]]:
        with path.open(newline="", encoding="utf-8") as handle:
            return list(csv.DictReader(handle))

    @staticmethod
    def _write(path: Path, fields: list[str], rows: list[dict[str, str]]) -> None:
        with path.open("w", newline="", encoding="utf-8") as handle:
            writer = csv.DictWriter(handle, fieldnames=fields)
            writer.writeheader()
            writer.writerows(rows)

    def store_message(self, message: DiscordMessage) -> DiscordMessage:
        self.initialize()
        rows = self._read(self.messages_path)
        payload = message.model_dump(mode="json")
        payload = {key: "" if value is None else str(value) for key, value in payload.items()}
        rows = [row for row in rows if row["message_id"] != message.message_id]
        rows.append(payload)
        self._write(self.messages_path, list(payload), rows)
        return message

    def list_recent_user_messages(self, user_id: str, limit: int = 20) -> list[DiscordMessage]:
        self.initialize()
        rows = [DiscordMessage.model_validate(row) for row in self._read(self.messages_path) if row["user_id"] == user_id]
        return sorted(rows, key=lambda item: item.created_at, reverse=True)[:limit]

    def list_recent_channel_messages(self, channel_id: str, limit: int = 20) -> list[DiscordMessage]:
        self.initialize()
        rows = [DiscordMessage.model_validate(row) for row in self._read(self.messages_path) if row["channel_id"] == channel_id]
        return sorted(rows, key=lambda item: item.created_at, reverse=True)[:limit]

    def create_issue(self, issue: IssueRecord) -> IssueRecord:
        self.initialize()
        rows = self._read(self.issues_path)
        payload = {key: str(value) for key, value in issue.model_dump(mode="json").items()}
        rows.append(payload)
        self._write(self.issues_path, list(payload), rows)
        return issue

    def get_issue(self, issue_id: str) -> IssueRecord | None:
        self.initialize()
        for row in self._read(self.issues_path):
            if row["issue_id"] == issue_id:
                return IssueRecord.model_validate(row)
        return None

    def find_open_issue(self, user_id: str, channel_id: str) -> IssueRecord | None:
        self.initialize()
        matches = [IssueRecord.model_validate(row) for row in self._read(self.issues_path) if row["user_id"] == user_id and row["channel_id"] == channel_id and row["status"] in {IssueStatus.OPEN.value, IssueStatus.RESPONDED.value}]
        return max(matches, key=lambda item: item.created_at) if matches else None

    def update_issue_status(self, issue_id: str, status: IssueStatus) -> IssueRecord | None:
        self.initialize()
        rows = self._read(self.issues_path)
        for row in rows:
            if row["issue_id"] == issue_id:
                row["status"] = status.value
        self._write(self.issues_path, ["issue_id", "user_id", "channel_id", "message_id", "summary", "category", "status", "created_at"], rows)
        return self.get_issue(issue_id)

    def save_profile(self, profile: UserCommunicationProfile) -> UserCommunicationProfile:
        self.initialize()
        rows = [row for row in self._read(self.profiles_path) if row["user_id"] != profile.user_id]
        rows.append({"user_id": profile.user_id, "profile_json": json.dumps(profile.model_dump(mode="json"))})
        self._write(self.profiles_path, ["user_id", "profile_json"], rows)
        return profile

    def get_profile(self, user_id: str) -> UserCommunicationProfile | None:
        self.initialize()
        for row in self._read(self.profiles_path):
            if row["user_id"] == user_id:
                return UserCommunicationProfile.model_validate(json.loads(row["profile_json"]))
        return None


Database = CsvStore
