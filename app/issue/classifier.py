from uuid import uuid4

from app.issue.detector import IssueDetector
from app.storage.database import CsvStore
from app.storage.models import DiscordMessage, IssueRecord


class IssueService:
    def __init__(self, store: CsvStore, detector: IssueDetector | None = None) -> None:
        self.store = store
        self.detector = detector or IssueDetector()

    def ingest(self, message: DiscordMessage) -> tuple[IssueRecord | None, bool]:
        self.store.store_message(message)
        existing = self.store.find_open_issue(message.user_id, message.channel_id)
        detection = self.detector.detect(message.content)
        if existing and any(word in message.content.lower() for word in ("still", "tried", "same", "again", "already")):
            return existing, True
        if not detection.is_issue:
            return None, False
        issue = IssueRecord(issue_id=str(uuid4()), user_id=message.user_id, channel_id=message.channel_id, message_id=message.message_id, summary=message.content[:240], category=detection.category or "general")
        return self.store.create_issue(issue), False
