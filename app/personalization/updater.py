from app.personalization.analyzer import PersonalizationAnalyzer
from app.storage.database import CsvStore
from app.storage.models import UserCommunicationProfile


class ProfileUpdater:
    def __init__(self, store: CsvStore, analyzer: PersonalizationAnalyzer | None = None) -> None:
        self.store = store
        self.analyzer = analyzer or PersonalizationAnalyzer()

    def refresh(self, user_id: str) -> UserCommunicationProfile:
        profile = self.analyzer.analyze(user_id, self.store.list_recent_user_messages(user_id, limit=40))
        return self.store.save_profile(profile)

    def get_or_refresh(self, user_id: str) -> UserCommunicationProfile:
        return self.store.get_profile(user_id) or self.refresh(user_id)
