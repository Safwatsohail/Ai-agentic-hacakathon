from __future__ import annotations

from app.agent.prompts import RESPONSE_AGENT_INSTRUCTION
from app.storage.models import ContextBundle, UserCommunicationProfile

try:
    from google.adk.agents import Agent as AdkAgent
except ImportError:  # Google ADK is an optional runtime integration.
    AdkAgent = None


def build_adk_agent():
    if AdkAgent is None:
        return None
    return AdkAgent(name="discord_issue_response_agent", model="gemini-2.0-flash", instruction=RESPONSE_AGENT_INSTRUCTION)


class ResponseAgent:
    """Deterministic local responder; the ADK object is available when its extra is installed."""

    def generate(self, context: ContextBundle, profile: UserCommunicationProfile) -> str:
        issue = context.issue.summary.strip()
        style = profile.style.verbosity
        opener = "I can help with that."
        if context.issue.category == "authentication":
            guidance = "Please confirm the exact sign-in error, then verify the account credentials and any configured authentication environment variables."
        elif context.issue.category == "deployment":
            guidance = "Please share the failing build or deployment log line and confirm which environment you are deploying to."
        elif context.issue.category == "configuration":
            guidance = "Please check the relevant configuration values and share the exact error message, with secrets removed."
        elif context.issue.category == "pull_request":
            guidance = "Please confirm the source and target branches, then share the exact GitHub or CI error. Also check whether the branch is behind the target branch or blocked by required checks."
        else:
            guidance = "Please share the exact error message and the last action that worked, with any secrets removed."
        if style == "detailed":
            return f"{opener} I understand the issue as: {issue}\n\n{guidance}\n\nOnce you share that, I can suggest the next diagnostic step."
        return f"{opener} I understand the issue as: {issue[:220]}\n\n{guidance}"
