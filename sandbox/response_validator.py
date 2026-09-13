"""Safety rail for any reply Orchestr posts on GitHub issues."""

# Internal terms a public GitHub comment must never leak.
FORBIDDEN_TERMS = (
    "system prompt",
    "internal context",
    "personalization profile",
    "hidden instruction",
    "orchestr sandbox",
    "sandbox poller",
    "agent instruction",
    "language model",
    "gemini",
    "adk",
)

# A useful reply must read as actionable rather than just acknowledging.
ACTION_WORDS = ("fix", "pr", "pull request", "check", "review", "test", "steps", "trace", "log", "repro")

MAX_LENGTH = 1800


def validate(reply: str, issue_text: str) -> dict:
    """Returns {"valid", "reasons", "cleaned_response"}."""
    cleaned = (reply or "").strip()
    reasons: list[str] = []
    lowered = cleaned.lower()
    issue_text_lowered = (issue_text or "").lower()

    if not cleaned:
        reasons.append("Response is empty.")
    if len(cleaned) > MAX_LENGTH:
        reasons.append(f"Response exceeds {MAX_LENGTH} characters.")
    leaked = [term for term in FORBIDDEN_TERMS if term in lowered]
    if leaked:
        reasons.append(f"Response exposes internal implementation details ({', '.join(leaked)}).")
    if issue_text:
        for term in ("system prompt", "hidden instruction", "personalization profile"):
            if term in issue_text_lowered:
                reasons.append("Issue contains a forbidden marker term.")
                break
    # A real support reply must advance the conversation with an actionable signal.
    if cleaned and not any(word in lowered for word in ACTION_WORDS):
        reasons.append("Response lacks an actionable step.")

    return {
        "valid": not reasons,
        "reasons": reasons,
        "cleaned_response": cleaned,
    }


def fallback() -> str:
    return (
        "Thanks for reporting this. I'm unable to produce an actionable reply "
        "for it right now — please share the exact error message, any logs, and "
        "the last step that worked (with secrets removed), and I'll pick it up."
    )