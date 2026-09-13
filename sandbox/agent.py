import asyncio
import os
import time
from concurrent.futures import ThreadPoolExecutor, TimeoutError as FutureTimeout

import requests
from google.adk.agents import Agent
from google.adk.runners import Runner
from google.adk.sessions import InMemorySessionService
from google.adk.tools import FunctionTool, ToolContext
from google.genai import types

import calendar_tools
import github_tools


def run_async(coro):
    return asyncio.run(coro)

BACKEND_URL = os.environ.get("BACKEND_URL", "http://backend:8000")
GEMINI_MODEL = os.environ.get("GEMINI_MODEL", "gemini-3.6-flash")
APP_NAME = "orchestr_sandbox"

RUN_TIMEOUT_SECONDS = int(os.environ.get("RUN_TIMEOUT_SECONDS", 240))
MAX_ATTEMPTS = 2

# Module-level executor so a hung LLM thread can never block the poller loop.
_executor = ThreadPoolExecutor(max_workers=2)
_attempts = {}


def run_with_timeout(fn, timeout_seconds):
    future = _executor.submit(fn)
    return future.result(timeout=timeout_seconds)


def give_up_or_fail_later(incident_id):
    """Bumps the attempt counter; returns True once the incident is exhausted."""
    attempts = _attempts.get(incident_id, 0) + 1
    _attempts[incident_id] = attempts
    return attempts >= MAX_ATTEMPTS

# --- Ledger plumbing ---


def log_ledger(incident_id, step, message, status="in_progress"):
    if not incident_id:
        return
    try:
        requests.post(
            f"{BACKEND_URL}/api/incidents/{incident_id}/ledger",
            json={"step": step, "message": message, "status": status},
            timeout=5,
        )
    except Exception:
        pass


# --- Agent Tools (each logs before/after to the ledger) ---


def github_investigate(t: ToolContext) -> str:
    """Finds the latest commits in the target repository. Call this first."""
    incident_id = t.state.get("incident_id", "")
    log_ledger(incident_id, "github_investigate", "Reading recent GitHub commits...", "in_progress")
    try:
        result = github_tools.github_investigate()
        log_ledger(incident_id, "github_investigate", "Latest commits retrieved from GitHub", "verified")
        return result
    except Exception as e:
        log_ledger(incident_id, "github_investigate", f"Failed to read commits: {e}", "failed")
        raise


def read_commit_diff(sha: str, t: ToolContext) -> str:
    """Reads the line-by-line diff of a specific commit. Pass the full commit sha."""
    incident_id = t.state.get("incident_id", "")
    log_ledger(incident_id, "github_read", f"Reading diff for commit {sha[:7]}...", "in_progress")
    try:
        result = github_tools.read_commit_diff(sha)
        log_ledger(incident_id, "github_read", f"Diff for commit {sha[:7]} retrieved", "verified")
        return result
    except Exception as e:
        log_ledger(incident_id, "github_read", f"Failed to read diff: {e}", "failed")
        raise


def create_fix_pr(
    pr_title: str,
    pr_body: str,
    file_path: str,
    file_content: str,
    test_path: str = "",
    test_content: str = "",
    t: ToolContext = None,
) -> str:
    """Opens a Pull Request that fixes the incident and runs a real test first.

    Args:
    - pr_title: short, specific title naming the bug and the file (e.g. "fix: PROMO10 applies 10% twice in checkout.py").
    - pr_body: LONG GitHub-flavored Markdown with emoji section headers covering
      (1) what broke and its impact, (2) root cause with file:line references
      from the diff, (3) the fix, (4) why it is correct. Do NOT invent log
      output or CI results; the tool runs your test and appends real output.
    - file_path: path of the fixed file, relative to the repo root.
    - file_content: FULL corrected content of that file.
    - test_path: path for a new test file, relative to the repo root (optional).
    - test_content: real Python that asserts the fixed behavior (optional). It is
      executed locally; if it fails the PR is blocked and you can retry.
    """
    incident_id = t.state.get("incident_id", "")
    log_ledger(incident_id, "github_pr", "Creating fix Pull Request...", "in_progress")
    try:
        pr_url = github_tools.create_fix_pr(
            file_path=file_path,
            file_content=file_content,
            pr_title=pr_title,
            pr_body=pr_body,
            test_path=test_path,
            test_content=test_content,
        )
        t.state["pr_url"] = pr_url
        log_ledger(incident_id, "github_pr", f"PR created: {pr_url}", "verified")
        return pr_url
    except Exception as e:
        log_ledger(incident_id, "github_pr", f"PR creation failed: {e}", "failed")
        raise


def schedule_calendar_meeting(
    title: str,
    description: str = "",
    start_in_minutes: int = 15,
    duration_minutes: int = 60,
    t: ToolContext = None,
) -> str:
    """Schedules an Incident Review meeting on Google Calendar.

    Args:
    - title: short, descriptive — emojis welcome (e.g. "🔧 Incident Review: PROMO10 double discount").
    - description: detailed PLAIN TEXT (no Markdown — Google Calendar displays
      it verbatim, but emojis render fine). Cover what broke, the impact, the
      root cause, and the fix. Use emojis + plain lines (" - " bullets) for structure.
      Incident id and fix PR link are appended automatically.
    - start_in_minutes: how many minutes from now the meeting starts (default 15).
    - duration_minutes: meeting length in minutes (default 60).
    """
    incident_id = t.state.get("incident_id", "")
    pr_url = t.state.get("pr_url", "")
    log_ledger(incident_id, "calendar_schedule", "Scheduling Incident Review meeting...", "in_progress")
    try:
        footer = f"\n\n📌 Tracking\n- Incident: {incident_id}\n- Repository: {os.environ.get('GITHUB_TARGET_REPO', '')}"
        if pr_url:
            footer += f"\n- Fix PR: {pr_url}"
        full = f"{description}{footer}" if description else footer
        link = calendar_tools.schedule_calendar_meeting(
            title,
            full,
            start_in_minutes=start_in_minutes,
            duration_minutes=duration_minutes,
        )
        t.state["calendar_link"] = link
        log_ledger(incident_id, "calendar_schedule", f"Meeting scheduled: {link}", "verified")
        return f"Scheduled '{title}': {link}"
    except Exception as e:
        log_ledger(incident_id, "calendar_schedule", f"Scheduling failed: {e}", "failed")
        raise


# --- Agent definition ---

INSTRUCTION = """You are Orchestr, an AI operations agent that fixes production incidents.

Follow this exact happy path, in order:
1. Call github_investigate() to list recent commits in the target repository.
2. Identify the suspicious commit and call read_commit_diff() with its sha.
3. Find the bug in the diff. Write a real Python test that proves the fixed
   behavior, then call create_fix_pr(). Requirements for the PR:
   - pr_title: concise but specific — name the bug AND the file, e.g.
     "fix: PROMO10 discounts are applied twice in checkout.py" (no emojis in the title).
   - pr_body: LONG Markdown (aim for 12+ lines) with emoji headers:
       ### 🐛 Summary
       ### 🔍 Root cause   (reference file and line numbers from the diff)
       ### 🛠 The fix
       ### ✅ Why this is correct
     Write it like a human engineer would. Never invent test or CI output —
     the tool appends the real results.
   - test_content: a real test using asserts on the fixed file. It runs locally;
     if it fails read the output and retry with a corrected fix/test.
4. Call schedule_calendar_meeting() to book the "Incident Review". Use a
   descriptive title and a rich description with emojis (Google Calendar renders
   emojis fine but NOT Markdown — write PLAIN TEXT, no #, **, backticks or ---).
   Cover impact, root cause, fix, PR link.

Keep your final response short: summarize the PR and the meeting.
"""

TOOLS = [
    FunctionTool(github_investigate),
    FunctionTool(read_commit_diff),
    FunctionTool(create_fix_pr),
    FunctionTool(schedule_calendar_meeting),
]


def build_agent():
    return Agent(
        name="Orchestr",
        model=GEMINI_MODEL,
        instruction=INSTRUCTION,
        tools=TOOLS,
    )


# --- Incident processing ---


def run_agent_to_completion(runner, session_id, message):
    """Iterates the ADK runner until the final response; returns the final text."""
    final_text = None
    for event in runner.run(
        user_id="orchestr", session_id=session_id, new_message=message
    ):
        if event.is_final_response() and event.content and event.content.parts:
            final_text = event.content.parts[0].text
    return final_text


def mark_done(incident_id, status, pr_url="", calendar_link=""):
    try:
        requests.post(
            f"{BACKEND_URL}/api/incidents/{incident_id}/complete",
            json={"pr_url": pr_url, "calendar_link": calendar_link, "status": status},
            timeout=5,
        )
    except Exception as e:
        print(f"Failed to mark incident: {e}")


def process_incident(incident):
    incident_id = incident["id"]
    context = incident.get("context", "")
    attempts = _attempts.get(incident_id, 0)
    print(f"Processing {incident_id} (attempt {attempts + 1}/{MAX_ATTEMPTS})...")
    log_ledger(incident_id, "agent_started", "Agent handoff received; beginning happy-path execution.", "verified")

    if attempts >= MAX_ATTEMPTS:
        print(f"{incident_id} exhausted; marking failed.")
        log_ledger(incident_id, "agent_run", f"Exhausted after {MAX_ATTEMPTS} attempts; failing incident.", "failed")
        mark_done(incident_id, status="failed")
        return

    session_service = InMemorySessionService()
    session = run_async(
        session_service.create_session(
            app_name=APP_NAME,
            user_id="orchestr",
            state={"incident_id": incident_id, "repo": os.environ.get("GITHUB_TARGET_REPO", "")},
        )
    )
    runner = Runner(agent=build_agent(), app_name=APP_NAME, session_service=session_service)

    prompt = (
        "Handle this production incident.\n\n"
        f"--- Incident Context ---\n{context}\n"
        "--- End Context ---\n\n"
        "Follow the happy path: investigate commits, read the suspicious diff, "
        "create a fix PR, then schedule the incident review meeting."
    )

    try:
        final_text = run_with_timeout(
            lambda: run_agent_to_completion(
                runner,
                session.id,
                types.Content(parts=[types.Part(text=prompt)]),
            ),
            RUN_TIMEOUT_SECONDS,
        )
        if final_text:
            print(final_text)
    except FutureTimeout:
        # A free-threaded timeout: the run thread is orphaned on purpose so the
        #  poller never blocks; the incident is retried (or failed) next round.
        if give_up_or_fail_later(incident_id):
            log_ledger(incident_id, "agent_run", f"Agent run timed out after {RUN_TIMEOUT_SECONDS}s.", "failed")
            mark_done(incident_id, status="failed")
        else:
            log_ledger(incident_id, "agent_run", f"Agent run timed out after {RUN_TIMEOUT_SECONDS}s; will retry.", "failed")
        return
    except Exception as e:
        if give_up_or_fail_later(incident_id):
            log_ledger(incident_id, "agent_run", f"Agent run failed: {e}", "failed")
            mark_done(incident_id, status="failed")
        else:
            log_ledger(incident_id, "agent_run", f"Agent run failed ({e}); will retry.", "failed")
        return

    refreshed = run_async(
        session_service.get_session(
            app_name=APP_NAME, user_id="orchestr", session_id=session.id
        )
    )
    pr_url = refreshed.state.get("pr_url", "")
    cal_link = refreshed.state.get("calendar_link", "")
    log_ledger(incident_id, "complete", "All steps verified; completing incident.", "verified")
    mark_done(incident_id, status="verified", pr_url=pr_url, calendar_link=cal_link)


# --- Poller loop ---

def poll():
    print("Orchestr Sandbox Poller Starting...")
    while True:
        try:
            resp = requests.get(f"{BACKEND_URL}/api/incidents/pending", timeout=5)
            if resp.status_code == 200:
                for inc in resp.json():
                    process_incident(inc)
        except Exception:
            pass
        time.sleep(5)


if __name__ == "__main__":
    poll()