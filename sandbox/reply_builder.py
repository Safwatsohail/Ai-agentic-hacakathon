"""Deterministic, profile-adapted comment builder for GitHub issues.

Produces the two kinds of public reply the watcher publishes:
- "triage": the acknowledgement + diagnosis posted when an issue is picked up
  (for bugs routed to the fix pipeline this is the investigation notice).
- "fix": the follow-up posted once a fix PR (and optionally a review meeting)
  exists.
- "guidance": the finishing reply for questions / enhancements / low-severity
  issues that do not go through the fix pipeline.
"""

CATEGORY_LABEL = {
    "bug": "🐛 Bug",
    "incident": "🚨 Incident",
    "enhancement": "✨ Enhancement",
    "question": "❓ Question",
}

SEVERITY_LABEL = {
    "low": "low",
    "medium": "medium",
    "high": "high",
    "critical": "critical",
}

CATEGORY_GUIDANCE = {
    "bug": (
        "Since this looks like a code bug, I triaged it into the fix pipeline "
        "and will open a pull request with a regression test as soon as the "
        "investigation completes."
    ),
    "incident": (
        "This is being treated as a live incident: it has been escalated to my "
        "fix pipeline (root-cause hunt, fix PR, then a review meeting) and the "
        "team's dev channel has been notified."
    ),
    "enhancement": (
        "Understood — I logged this as an enhancement. To make it actionable, "
        "a short description of the expected behavior and the current behavior "
        "would help prioritise it."
    ),
    "question": (
        "Here's a direct answer so we can close this out quickly. If you quote "
        "the exact command or error you saw (secrets removed), I can narrow it "
        "down further."
    ),
}


def _opener(profile):
    if profile and profile.get("style", {}).get("formality") == "casual":
        return "Hey 👋 — Orchestr here."
    return "Hello — Orchestr reporting in."


def _steps_block(profile, lines):
    """Wraps guidance lines as numbered steps when the user prefers them."""
    if not lines:
        return ""
    if profile and "prefers actionable steps or examples" in profile.get("preferences", []):
        return "Here are the next steps:\n" + "".join(f"{i + 1}. {line}\n" for i, line in enumerate(lines))
    return "\n".join(f"• {line}" for line in lines)


def build_reply(issue, classification, profile, payload) -> str:
    """Builds a single public comment string.

    Args:
      issue: dict with title/summary from the GitHub issue.
      classification: {"category", "severity"}.
      profile: adapted profile dict (nullable).
      payload: {"kind": "triage"|"fix"|"guidance",
                "pr_url": str, "calendar_link": str,
                "summary": str (short explanation of the finding)}
    """
    kind = payload.get("kind", "guidance")
    category = classification.get("category", "question")
    severity = classification.get("severity", "low")
    title = (issue.get("title") or "your issue").strip()
    summary = payload.get("summary", "")
    verbosity = (profile or {}).get("style", {}).get("verbosity", "balanced")

    parts = [_opener(profile)]
    header = CATEGORY_LABEL.get(category, "ℹ️ Issue")
    parts.append(f"**{header} triaged** — `{title}` (severity: {SEVERITY_LABEL.get(severity, severity)})")

    if summary:
        parts.append(summary)

    if kind == "triage":
        parts.append(CATEGORY_GUIDANCE.get(category, CATEGORY_GUIDANCE["question"]))
        return _finalize(parts, profile, verbosity, short=True)

    if kind == "fix":
        parts.append("✅ **Fix is ready.** I opened a pull request that addresses this, backed by a real test run.")
        if payload.get("pr_url"):
            parts.append(f"🔧 Fix PR: {payload['pr_url']}")
        if payload.get("calendar_link"):
            parts.append(f"📅 Incident Review meeting: {payload['calendar_link']}")
        parts.append(
            "Please review and merge the PR — it closes this issue on merge. "
            "If you spot any edge case, reply here and I'll adjust it."
        )
        return _finalize(parts, profile, verbosity, short=False)

    # kind == "guidance"
    if category == "enhancement":
        parts.append(
            _steps_block(profile, [
                "Describe the expected vs. current behavior in a short comment.",
                "If there is a reference design or spec, link it.",
                "Once the team prioritises it, I can implement and open a PR.",
            ])
        )
    elif category == "question":
        parts.append(
            _steps_block(profile, [
                "Quote the exact command, error, or reproduce steps you saw (remove any secrets).",
                "Tell me the environment you used (local, CI, production).",
                "Reply back here and I'll continue from the error."
            ])
        )
    elif category in ("bug", "incident"):
        parts.append(
            _steps_block(profile, [
                "Share the exact error or log line that fails (secrets removed).",
                "Add a minimal reproduction, or the last commit hash that worked.",
                "Reply here and I'll pick it up from the trace."
            ])
        )
    else:
        parts.append(CATEGORY_GUIDANCE.get(category, CATEGORY_GUIDANCE["question"]))
    return _finalize(parts, profile, verbosity, short=False)


def _finalize(parts, profile, verbosity, short):
    signature = (
        "> Orchestr · verified AI operations agent"
    )
    if not short and verbosity == "detailed" and profile and profile.get("confidence", 0) > 0.3:
        parts.append(
            "_(I can also produce a longer walkthrough with logs and trace-level "
            "detail if that's easier to review.)_"
        )
    parts.append(signature)
    return "\n\n".join(parts)