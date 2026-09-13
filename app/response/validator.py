from app.storage.models import ResponseValidationResult


class ResponseValidator:
    FORBIDDEN = ("system prompt", "personalization profile", "hidden instruction", "internal context")

    def validate(self, response: str, issue_text: str) -> ResponseValidationResult:
        cleaned = response.strip()
        reasons: list[str] = []
        if not cleaned:
            reasons.append("Response is empty.")
        if len(cleaned) > 1800:
            reasons.append("Response exceeds Discord-safe length.")
        if any(term in cleaned.lower() for term in self.FORBIDDEN):
            reasons.append("Response exposes internal implementation details.")
        if not any(word in cleaned.lower() for word in ("error", "share", "check", "help", "confirm")):
            reasons.append("Response lacks an actionable support step.")
        return ResponseValidationResult(valid=not reasons, reasons=reasons, cleaned_response=cleaned)

    @staticmethod
    def fallback() -> str:
        return "I need the exact error message and the last action that worked to help diagnose this. Please remove any secrets before sharing it."
