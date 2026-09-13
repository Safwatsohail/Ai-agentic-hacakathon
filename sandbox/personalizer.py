"""Build a lightweight communication profile for a GitHub user from their
public issue/comment texts in the watched repo. Used to adapt reply tone.

This mirrors the hackathon-team's "personalized response agent" idea but in a
healthier form: word-boundary matching, a real emoji range, and confidence
based on the amount of observed evidence. Only *observable style* is inferred;
nothing sensitive is guessed.
"""

import re

VERBOSE_THRESHOLD = 200
CONCISE_THRESHOLD = 70

EMOJI_RE = re.compile(
    "[\U0001F000-\U0001FAFF\u2600-\u27BF\u2B00-\u2BFF\ufe0f]"
)

CASUAL_PHRASES = (
    "lol", "lmao", "hey", "hi ", "yo ", "pls", "plz", "tbh", "imho", "imo",
    "dude", "guys", "nah", "yeah", "yep", "cool", "awesome", "srsly", "btw",
)

POLITE_PHRASES = (
    "please", "could you", "would you", "thank", "thanks", "appreciate",
    "kindly", "when you get a chance",
)

STEPS_PHRASES = (
    "step", "steps", "how do", "how can", "how would", "example", "guide",
    "walkthrough", "instructions", "tell me", "what should i do",
)

SPLIT_RE = re.compile(r"[^\w]+")


def _matches(text, phrases):
    chopped = SPLIT_RE.sub(" ", text.lower())
    return [phrase for phrase in phrases if phrase in chopped]


class ProfileBuilder:
    def analyze(self, login: str, samples: list[str]) -> dict:
        """Returns a profile dict for a user given their observed texts."""
        if not samples:
            return self._empty(login, reason="no_evidence")

        joined = " ".join(samples).lower()
        lengths = [len(sample) for sample in samples if sample and sample != sample.isspace()]
        avg_length = sum(lengths) / len(lengths) if lengths else 0

        verbosity = (
            "detailed"
            if avg_length >= VERBOSE_THRESHOLD
            else "concise"
            if avg_length < CONCISE_THRESHOLD
            else "balanced"
        )
        formality = "casual" if _matches(joined, CASUAL_PHRASES) else "neutral"
        uses_emoji = bool(EMOJI_RE.search(joined))
        wants_steps = bool(_matches(joined, STEPS_PHRASES))
        polite = bool(_matches(joined, POLITE_PHRASES))

        preferences = []
        if wants_steps:
            preferences.append("prefers actionable steps or examples")
        if polite:
            preferences.append("communicates politely")
        if uses_emoji:
            preferences.append("uses emojis")

        confidence = min(0.95, len(samples) / 15)
        return {
            "user_id": login,
            "style": {
                "formality": formality,
                "verbosity": verbosity,
                "emoji_usage": "uses emojis" if uses_emoji else "not observed",
            },
            "preferences": preferences,
            "observed_patterns": [],
            "evidence_count": len(samples),
            "confidence": round(confidence, 2),
        }

    def _empty(self, login: str, reason: str) -> dict:
        return {
            "user_id": login,
            "style": {"formality": "neutral", "verbosity": "balanced", "emoji_usage": "not observed"},
            "preferences": [],
            "observed_patterns": [f"profile placeholder ({reason})"],
            "evidence_count": 0,
            "confidence": 0.0,
        }


def build_profile(login: str, samples: list[str]) -> dict:
    return ProfileBuilder().analyze(login, samples)