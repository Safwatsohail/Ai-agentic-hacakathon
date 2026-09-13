from app.personalization.updater import ProfileUpdater
from app.storage.database import CsvStore
from app.storage.models import DiscordMessage


def test_profile_uses_observed_messages(tmp_path):
    store = CsvStore(tmp_path)
    store.store_message(DiscordMessage(message_id="1", user_id="u1", channel_id="c1", content="hey, can you give me steps to fix this?"))
    profile = ProfileUpdater(store).refresh("u1")
    assert profile.evidence_count == 1
    assert "actionable steps" in profile.preferences[0]
