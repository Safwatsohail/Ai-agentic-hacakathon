from app.storage.database import CsvStore
from app.storage.models import ContextBundle, IssueRecord


class ContextRetriever:
    def __init__(self, store: CsvStore) -> None:
        self.store = store

    def retrieve(self, issue: IssueRecord) -> ContextBundle:
        recent = self.store.list_recent_channel_messages(issue.channel_id, limit=12)
        user_history = self.store.list_recent_user_messages(issue.user_id, limit=30)
        terms = {word.lower().strip(".,!?()") for word in issue.summary.split() if len(word) > 3}
        relevant = [message for message in user_history if any(term in message.content.lower() for term in terms)][:8]
        return ContextBundle(issue=issue, recent_messages=recent, relevant_history=relevant)
