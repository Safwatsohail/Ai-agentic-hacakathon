from app.agent.agent import ResponseAgent
from app.context.retrieval import ContextRetriever
from app.issue.classifier import IssueService
from app.personalization.updater import ProfileUpdater
from app.storage.database import CsvStore
from app.storage.models import DiscordMessage


def test_response_uses_observed_style_and_step_preference(tmp_path):
    store = CsvStore(tmp_path)
    service = IssueService(store)
    issue, _ = service.ingest(DiscordMessage(
        message_id="1", user_id="u1", channel_id="c1",
        content="hey, my config is not working. can you give me steps?",
    ))

    profile = ProfileUpdater(store).refresh("u1")
    response = ResponseAgent().generate(ContextRetriever(store).retrieve(issue), profile)

    assert response.startswith("Got it")
    assert "Here are the next steps:" in response
