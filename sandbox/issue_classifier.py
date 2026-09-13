"""Triage GitHub issues into a category and a severity rating.

Category/Severity are used by the issue watcher to decide between a plain
reply (questions / enhancements) and routing the issue through the fix
pipeline (bugs, incidents).
"""

import re

CATEGORY_KEYWORDS = {
    "question": [
        "how do", "how can", "how would", "what is", "what's", "why is",
        "where is", "is there a way", "can you", "could you", "would you",
        "please explain", "does this support", "is this supported",
        "is it possible", "i'm confused", "i am confused", "clarify",
    ],
    "enhancement": [
        "feature", "suggest", "suggestion", "improve", "improvement",
        "should be able", "would be nice", "nice to have", "add support",
        "request", "proposal", "enhance", "option to", "when will",
        "roadmap", "planned", "idea",
    ],
    "bug": [
        "bug", "error", "crash", "crashes", "broken", "broke", "fails",
        "failure", "not working", "doesn't work", "does not work", "issue",
        "problem", "wrong", "incorrect", "regression", "exception",
        "unexpected", "malfunction", "gives me", "returns", "can't use",
        "cannot use", "missing", "wrong output", "miscalculat", "double",
        "drop", "deduplicat",
    ],
    "incident": [
        "outage", "down", "500 error", "5xx", "503", "502", "downtime",
        "production", "prod is", "in prod", "data loss", "data leak",
        "security", "vulnerability", "breach", "compromised", "exploit",
        "urgent", "emergency", "blocked", "unavailable", "can't deploy",
        "cannot deploy", "ci is red", "build is red", "service is down",
        "site is down", "severe",
    ],
}

# Keywords that immediately escalate severity when present.
CRITICAL_MARKERS = [
    "outage", "down", "500", "5xx", "503", "502", "downtime", "data loss",
    "data leak", "security", "vulnerability", "breach", "compromised",
    "exploit", "emergency", "urgent", "blocked", "prod is down",
    "production is down", "unavailable",
]

WORD_RE = re.compile(r"[a-z0-9]+")


def _hit_count(text, phrases):
    return sum(1 for phrase in phrases if phrase in text)


def classify(issue: dict) -> dict:
    """Runs the heuristics over an issue dict and returns a classification.

    The issue dict includes at least ``title`` and ``body`` (both optional).
    Returns {"category": ..., "severity": ..., "labels": [...], "reasons": [...]}.
    """
    title = (issue.get("title") or "").strip()
    body = (issue.get("body") or "").strip()
    full = f"{title}\n{body}".lower()

    reasons: list[str] = []
    best_category = "question"
    best_hits = 0
    for category, phrases in CATEGORY_KEYWORDS.items():
        hits = _hit_count(full, phrases)
        if hits > best_hits:
            best_hits = hits
            best_category = category
            reasons = [p for p in phrases if p in full]

    # Incidents are the highest-confidence signal: never downgrade a prod event.
    if _hit_count(full, CATEGORY_KEYWORDS["incident"]) > 0:
        best_category = "incident"

    if not title and not body:
        best_category = "question"
        reasons = ["No descriptive text found."]

    severity = {"question": "low", "enhancement": "low", "bug": "medium", "incident": "critical"}[best_category]
    if best_category == "bug" and _hit_count(full, CATEGORY_KEYWORDS["incident"]) > 0:
        severity = "critical"
    if severity != "critical":
        critical_hits = _hit_count(full, CRITICAL_MARKERS)
        if critical_hits:
            severity = "critical" if critical_hits >= 2 else "high"

    labels = [best_category]
    return {
        "category": best_category,
        "severity": severity,
        "labels": labels,
        "reasons": reasons[:3],
    }