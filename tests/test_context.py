from app.context.retrieval import ContextRetriever
from app.issue.classifier import IssueService
from app.storage.database import CsvStore
from app.storage.models import DiscordMessage


def test_retrieves_bounded_context(tmp_path):
    store = CsvStore(tmp_path)
    service = IssueService(store)
    issue, _ = service.ingest(DiscordMessage(message_id="1", user_id="u1", channel_id="c1", content="My config is not working"))
    service.ingest(DiscordMessage(message_id="2", user_id="u1", channel_id="c1", content="I already checked the environment variables"))
    context = ContextRetriever(store).retrieve(issue)
    assert context.issue.issue_id == issue.issue_id
    assert len(context.recent_messages) == 2
