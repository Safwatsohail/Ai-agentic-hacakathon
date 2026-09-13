import os
import re
from datetime import datetime, timedelta, timezone

from google.auth.transport.requests import Request
from google.oauth2 import service_account
from googleapiclient.discovery import build

SCOPES = ["https://www.googleapis.com/auth/calendar"]

CALENDAR_SUMMARY = os.environ.get(
    "CALENDAR_SUMMARY", "Orchestr Incident Reviews"
)


def _get_service():
    creds_file = os.environ.get(
        "GOOGLE_APPLICATION_CREDENTIALS", "/app/google_credentials.json"
    )
    credentials = service_account.Credentials.from_service_account_file(
        creds_file, scopes=SCOPES
    )
    return build("calendar", "v3", credentials=credentials)


def _get_or_create_calendar(service):
    """Returns the id of the dedicated public 'Orchestr Incident Reviews' calendar.

    A separate calendar is required because Google's API refuses to make a
    service account's *primary* calendar public ("Cannot remove the last owner..."
    when inserting a default-scope ACL rule), which otherwise leaves event links
    unviewable and 404-ing for anyone outside the service account.
    """
    for cal in service.calendarList().list().execute().get("items", []):
        if cal.get("summary") == CALENDAR_SUMMARY:
            return cal["id"]
    return service.calendars().insert(body={"summary": CALENDAR_SUMMARY}).execute()["id"]


def ensure_public_calendar(calendar_id):
    """Grants public read access ('see all event details') so Discord event links work."""
    service = _get_service()
    existing = service.acl().list(calendarId=calendar_id).execute().get("items", [])
    if any(a.get("scope", {}).get("type") == "default" for a in existing):
        return
    service.acl().insert(
        calendarId=calendar_id,
        body={"role": "reader", "scope": {"type": "default"}},
    ).execute()


def _to_plain_text(text: str) -> str:
    """Strips Markdown syntax because Google Calendar renders plain text only."""
    lines = []
    for line in text.splitlines():
        line = re.sub(r"^#{1,6}\s*", "", line)  # headings
        line = re.sub(r"\*\*(.+?)\*\*", r"\1", line)  # bold
        line = re.sub(r"`([^`]*)`", r"\1", line)  # inline code
        line = re.sub(r"^>\s*", "", line)  # blockquotes
        line = re.sub(r"^\s*([-*_])\s*\1?\s*\1?\s*$", "", line).rstrip()  # hr
        lines.append(line)
    text = "\n".join(lines)
    text = re.sub(r"\n{3,}", "\n\n", text)  # collapse blank runs
    return text.strip()


def schedule_calendar_meeting(
    title: str,
    description: str = "",
    start_in_minutes: int = 15,
    duration_minutes: int = 60,
) -> str:
    """Creates an Incident Review event on the dedicated public calendar.

    Returns the public Google Calendar htmlLink to the created event.
    """
    service = _get_service()
    calendar_id = _get_or_create_calendar(service)
    ensure_public_calendar(calendar_id)
    start = datetime.now(timezone.utc) + timedelta(minutes=start_in_minutes)
    end = start + timedelta(minutes=duration_minutes)

    event = {
        "summary": title,
        "description": _to_plain_text(description),
        "visibility": "public",
        "start": {"dateTime": start.isoformat(), "timeZone": "UTC"},
        "end": {"dateTime": end.isoformat(), "timeZone": "UTC"},
    }
    created = service.events().insert(calendarId=calendar_id, body=event).execute()
    return created.get("htmlLink", "")