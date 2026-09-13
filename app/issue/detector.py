from app.storage.models import IssueDetectionResult


class IssueDetector:
    ISSUE_WORDS = {
        "error", "failed", "failure", "crash", "broken", "bug", "issue", "problem",
        "help", "cannot", "can't", "unable", "timeout", "exception", "not working",
    }
    CATEGORY_WORDS = {
        "authentication": {"login", "signin", "password", "auth"},
        "deployment": {"deploy", "deployment", "build", "release"},
        "configuration": {"config", "configuration", "environment", "env"},
    }

    def detect(self, text: str) -> IssueDetectionResult:
        normalized = text.lower().strip()
        if len(normalized) < 6 or normalized in {"hello", "hey", "hi", "thanks", "thank you"}:
            return IssueDetectionResult(is_issue=False, confidence=0.0, reason="Not an actionable support message.")
        matches = [word for word in self.ISSUE_WORDS if word in normalized]
        if not matches:
            return IssueDetectionResult(is_issue=False, confidence=0.1, reason="No issue indicators found.")
        category = "general"
        for name, words in self.CATEGORY_WORDS.items():
            if any(word in normalized for word in words):
                category = name
                break
        return IssueDetectionResult(is_issue=True, confidence=min(0.95, 0.55 + 0.1 * len(matches)), category=category, reason=f"Detected issue indicators: {', '.join(matches[:3])}.")
