"""Orchestr GitHub issue watchdog.

Polls the target repo for open issues every WATCH_INTERVAL_SECONDS (default
60s). New issues are triaged, their reporter's communication profile is
derived from their public texts, and they are either:

  * routed through the fix pipeline (bugs / incidents / high severity) by
    promoting them into an Orchestr Incident that the existing sandbox agent
    resolves (fix PR + calendar review + dev-channel notification), or
  * answered in place with a profile-adapted, validated reply (questions,
    enhancements, low-severity issues).

Every public comment passes through response_validator before it is posted.
State lives in the backend database so the watcher restarts cleanly.
"""

import json
import os
import time
from datetime import datetime, timezone

import requests

import github_tools as gt
import response_validator as rv
from issue_classifier import classify
from personalizer import build_profile
from reply_builder import build_reply

BACKEND_URL = os.environ.get("BACKEND_URL", "http://backend:8000")
REPO_NAME = os.environ.get("GITHUB_TARGET_REPO", "")

INTERVAL_SECONDS = int(os.environ.get("WATCH_INTERVAL_SECONDS", "60"))
AUTO_FIX_BUGS = os.environ.get("AUTO_FIX_BUGS", "true").lower() != "false"
REPLY_ON_ISSUES = os.environ.get("REPLY_ON_ISSUES", "true").lower() != "false"
ADAPT_REPLIES = os.environ.get("ADAPT_REPLIES", "true").lower() != "false"

HTTP_TIMEOUT = 5


def log(message):
    print(f"[issue_watch] {message}", flush=True)


# --- tiny HTTP helpers (fail loud in logs, never crash the poller) ---


def _api_get(path, timeout=HTTP_TIMEOUT):
    try:
        resp = requests.get(f"{BACKEND_URL}{path}", timeout=timeout)
        if resp.status_code == 200:
            return resp.json()
        log(f"GET {path} -> {resp.status_code}")
    except Exception as exc:
        log(f"GET {path} -> {exc}")
    return None


def _api_post(path, payload, timeout=HTTP_TIMEOUT):
    try:
        resp = requests.post(f"{BACKEND_URL}{path}", json=payload, timeout=timeout)
        if resp.status_code == 200:
            return resp.json()
        log(f"POST {path} -> {resp.status_code}")
    except Exception as exc:
        log(f"POST {path} -> {exc}")
    return None


def _now_iso():
    return datetime.now(timezone.utc).isoformat()


# --- profile management ---


def resolve_profile(login):
    """Returns a stored profile, building and persisting one when missing."""
    if not login:
        return {"user_id": "unknown", "style": {"formality": "neutral", "verbosity": "balanced"}}
    stored = _api_get(f"/api/users/{login}/profile")
    if stored and stored.get("profile"):
        return stored["profile"]
    try:
        samples = [sample["text"] for sample in json.loads(gt.list_user_issue_texts(login)) if sample.get("text")]
    except Exception as exc:
        log(f"profile history for {login} failed: {exc}")
        samples = []
    profile = build_profile(login, samples)
    _api_post(f"/api/users/{login}/profile", {"profile": profile})
    return profile


def adapt(profile, issue, classification, payload):
    """Builds a reply and always pushes it through the validator."""
    if not ADAPT_REPLIES:
        profile = None
    reply = build_reply(issue, classification, profile, payload)
    checked = rv.validate(reply, issue.get("body", ""))
    if not checked["valid"]:
        log(f"reply validation: {checked['reasons']}; using fallback")
        return rv.fallback()
    return checked["cleaned_response"]


# --- per-issue handling ---


def _result_payload(detail, classification, **extra):
    """Base payload for POST /api/issues/{n}/result, enriched with metadata."""
    labels = [label.get("name", "") for label in (detail.get("labels") or [])]
    payload = {
        "category": classification["category"],
        "severity": classification["severity"],
        "title": detail.get("title") or "",
        "author_login": (detail.get("author") or {}).get("login") or "",
        "repo": REPO_NAME,
        "labels": labels,
        "body": detail.get("body") or "",
    }
    payload.update(extra)
    return payload


def handle_issue(issue):
    number = issue.get("number")
    try:
        detail = json.loads(gt.get_issue(number))
    except Exception as exc:
        log(f"issue #{number}: view failed ({exc}); skipping this pass")
        return None

    classification = classify(detail)
    log(f"issue #{number} [{classification['category']}/{classification['severity']}] {detail.get('title','')!r}")

    # Apply a category label if it is not already present (low cost, easy to glance).
    existing = {label.get("name", "") for label in (detail.get("labels") or [])}
    wanted = [label for label in classification["labels"] if label not in existing]
    if wanted:
        try:
            gt.add_issue_labels(number, wanted)
        except Exception as exc:
            log(f"issue #{number}: label add failed ({exc})")

    author = (detail.get("author") or {}).get("login", "unknown")
    profile = resolve_profile(author)
    issue_summary = {"title": detail.get("title", "")}

    goes_to_pipeline = bool(
        classification["category"] in ("bug", "incident")
        and AUTO_FIX_BUGS
    ) or classification["severity"] in ("high", "critical")

    if not goes_to_pipeline:
        # Standalone guided reply (question / enhancement / low-severity bug).
        reply = adapt(
            profile,
            issue_summary,
            classification,
            {"kind": "guidance"},
        )
        if REPLY_ON_ISSUES:
            try:
                gt.post_issue_comment(number, reply)
            except Exception as exc:
                log(f"issue #{number}: comment failed ({exc})")
        _api_post(
            f"/api/issues/{number}/result",
            _result_payload(detail, classification, status="handled", reply=reply),
        )
        return {"status": "handled"}

    # Route through the existing fix pipeline.
    _api_post(
        f"/api/issues/{number}/result",
        _result_payload(detail, classification, status="processing"),
    )
    promoted = _api_post(f"/api/issues/{number}/promote", {"category": classification["category"]})
    incident_id = (promoted or {}).get("incident_id") or ""

    triage = adapt(
        profile,
        issue_summary,
        classification,
        {
            "kind": "triage",
            "summary": (
                f"Routing `{classification['category']}` to the fix pipeline"
                + (f" (tracking `{incident_id}`)" if incident_id else "")
                + "."
            ),
        },
    )
    if REPLY_ON_ISSUES:
        try:
            gt.post_issue_comment(number, triage)
        except Exception as exc:
            log(f"issue #{number}: triage comment failed ({exc})")

    _api_post(
        f"/api/issues/{number}/result",
        _result_payload(
            detail,
            classification,
            status="promoted",
            incident_id=incident_id,
            reply=triage,
        ),
    )
    return {"status": "promoted", "incident_id": incident_id}


def _row_payload(row, **extra):
    """Result payload from an already-stored backend row (dashboard-promoted
    issues may reach follow-up without a metadata-carrying handle_issue)."""
    payload = {
        "category": row.get("category"),
        "severity": row.get("severity"),
        "title": row.get("title"),
        "author_login": row.get("author_login"),
        "repo": row.get("repo"),
        "labels": row.get("labels"),
        "body": row.get("body"),
    }
    payload.update(extra)
    return payload


# --- follow-up comments once the fix pipeline finishes ---


def follow_up_promoted(processed):
    rows = _api_get("/api/issues?status=promoted")
    if not rows:
        return processed
    for row in rows:
        number = row.get("issue_number")
        issue_status = row.get("status")
        if number in processed or issue_status != "promoted":
            continue
        incident_status = row.get("incident_status")
        if incident_status == "investigating":
            continue

        profile = resolve_profile(row.get("author_login") or "unknown")
        if incident_status == "verified":
            reply = adapt(
                profile,
                {"title": row.get("title", "")},
                {"category": row.get("category", "bug"), "severity": row.get("severity", "medium")},
                {
                    "kind": "fix",
                    "pr_url": row.get("incident_pr_url") or "",
                    "calendar_link": row.get("incident_calendar_link") or "",
                    "summary": "The investigation finished and a corrective pull request was opened.",
                },
            )
            final_status = "resolved"
        elif incident_status == "failed":
            reply = adapt(
                profile,
                {"title": row.get("title", "")},
                {"category": row.get("category", "bug"), "severity": row.get("severity", "medium")},
                {
                    "kind": "guidance",
                    "summary": "⚠️ The automatic fix pipeline could not complete for this one.",
                },
            )
            final_status = "failed"
        else:
            continue

        if REPLY_ON_ISSUES:
            try:
                gt.post_issue_comment(number, reply)
            except Exception as exc:
                log(f"issue #{number}: final comment failed ({exc})")
        _api_post(
            f"/api/issues/{number}/result",
            _row_payload(row, status=final_status, reply=reply),
        )
        processed.add(number)
    return processed


# --- main loop ---


def scan():
    state = _api_get("/api/issues/scan-state")
    processed = set((state or {}).get("processed") or [])

    try:
        issues = json.loads(gt.list_open_issues())
    except Exception as exc:
        log(f"list_open_issues failed: {exc}")
        return processed

    active = set()
    for issue in issues:
        number = issue.get("number")
        active.add(number)
        if number in processed:
            continue
        handled = handle_issue(issue)
        if handled:
            processed.add(number)

    processed = follow_up_promoted(processed)

    _api_post(
        "/api/issues/scan-state",
        {"repo": REPO_NAME, "last_scan_at": _now_iso(), "processed": sorted(processed)},
    )
    return processed


def run_issue_watch():
    log(f"GitHub issue watchdog starting (interval={INTERVAL_SECONDS}s, repo={REPO_NAME or 'unset'})")
    while True:
        try:
            scan()
        except Exception as exc:
            log(f"scan failed: {exc}")
        time.sleep(INTERVAL_SECONDS)


if __name__ == "__main__":
    run_issue_watch()