from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.agent.agent import ResponseAgent
from app.context.retrieval import ContextRetriever
from app.issue.classifier import IssueService
from app.personalization.updater import ProfileUpdater
from app.response.validator import ResponseValidator
from app.storage.database import CsvStore
from app.storage.models import DiscordMessage, MessageCreate, IssueStatus

router = APIRouter()
store = CsvStore()
issues = IssueService(store)
profiles = ProfileUpdater(store)
retriever = ContextRetriever(store)
agent = ResponseAgent()
validator = ResponseValidator()


class ResponseRequest(BaseModel):
    issue_id: str
    personalization_consent: bool = False


@router.get("/health")
def health() -> dict[str, str]:
    store.initialize()
    return {"status": "ok"}


@router.post("/messages")
def ingest_message(payload: MessageCreate) -> dict[str, object]:
    message = DiscordMessage(**payload.model_dump())
    issue, is_follow_up = issues.ingest(message)
    return {"message_id": message.message_id, "issue": issue, "follow_up": is_follow_up}


@router.post("/issues/respond")
def respond(request: ResponseRequest) -> dict[str, object]:
    issue = store.get_issue(request.issue_id)
    if issue is None:
        raise HTTPException(status_code=404, detail="Issue not found")
    if not request.personalization_consent:
        store.update_issue_status(issue.issue_id, IssueStatus.CONSENT_PENDING)
        return {
            "issue_id": issue.issue_id,
            "status": IssueStatus.CONSENT_PENDING,
            "message": "Personalization consent is required before generating a reply.",
        }
    profile = profiles.get_or_refresh(issue.user_id)
    response = agent.generate(retriever.retrieve(issue), profile)
    checked = validator.validate(response, issue.summary)
    if not checked.valid:
        response = validator.fallback()
    store.update_issue_status(issue.issue_id, IssueStatus.RESPONDED)
    return {"issue_id": issue.issue_id, "response": response, "profile_confidence": profile.confidence}


@router.get("/users/{user_id}/profile")
def get_profile(user_id: str) -> dict[str, object]:
    return {"profile": profiles.get_or_refresh(user_id)}
