from app.storage.models import ContextBundle, UserCommunicationProfile


def build_agent_input(context: ContextBundle, profile: UserCommunicationProfile) -> dict[str, object]:
    return {
        "issue": context.issue.summary,
        "category": context.issue.category,
        "recent_messages": [message.content for message in context.recent_messages[-6:]],
        "relevant_history": [message.content for message in context.relevant_history[-4:]],
        "response_preferences": profile.preferences,
        "verbosity": profile.style.verbosity,
    }
