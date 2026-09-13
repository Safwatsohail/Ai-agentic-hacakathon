from app.storage.models import CommunicationStyle, DiscordMessage, UserCommunicationProfile


class PersonalizationAnalyzer:
    def analyze(self, user_id: str, messages: list[DiscordMessage]) -> UserCommunicationProfile:
        if not messages:
            return UserCommunicationProfile(user_id=user_id)
        content = [message.content for message in messages]
        average_length = sum(map(len, content)) / len(content)
        joined = " ".join(content).lower()
        casual_markers = ("lol", "hey", "pls", "thanks", "can't")
        preferences: list[str] = []
        patterns: list[str] = []
        if any(marker in joined for marker in ("step", "how do", "how can", "example")):
            preferences.append("Prefers actionable steps or examples when available.")
        if any(marker in joined for marker in ("please", "could you", "would you")):
            patterns.append("Uses polite requests.")
        if average_length > 180:
            verbosity = "detailed"
        elif average_length < 70:
            verbosity = "concise"
        else:
            verbosity = "balanced"
        style = CommunicationStyle(
            formality="casual" if any(marker in joined for marker in casual_markers) else "neutral",
            verbosity=verbosity,
            emoji_usage="uses emojis" if any(char in joined for char in (":", ";", "😊", "👍")) else "not observed",
        )
        return UserCommunicationProfile(user_id=user_id, style=style, preferences=preferences, observed_patterns=patterns, evidence_count=len(messages), confidence=min(0.9, len(messages) / 12))
