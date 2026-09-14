import json
import os
import re
import shlex
import shutil
import subprocess
import tempfile
import time

REPO_NAME = os.environ.get("GITHUB_TARGET_REPO", "")
GITHUB_USERNAME = os.environ.get("GITHUB_USERNAME", "")

AUTH_URL = os.environ.get("GITHUB_PUSH_URL", "")


def _auth_repo_url():
    if AUTH_URL:
        return AUTH_URL
    token = os.environ.get("GITHUB_TOKEN", "")
    username = GITHUB_USERNAME
    if not username and "/" in REPO_NAME:
        username = REPO_NAME.split("/", 1)[0]
    return f"https://{username}:{token}@github.com/{REPO_NAME}.git"


def _run(cmd, cwd=None):
    return subprocess.run(cmd, shell=True, capture_output=True, text=True, cwd=cwd)


def github_investigate(limit: int = 5) -> str:
    """Fetches the latest commits in the target repo (sha + commit message)."""
    cmd = (
        f"gh api repos/{REPO_NAME}/commits "
        f"--jq '.[0:{limit}] | map({{sha: .sha, message: .commit.message}})'"
    )
    result = _run(cmd)
    result.check_returncode()
    return result.stdout.strip()


def read_commit_diff(sha: str) -> str:
    """Returns the line-by-line diff for a specific commit."""
    cmd = (
        f"gh api repos/{REPO_NAME}/commits/{sha} "
        "-H 'Accept: application/vnd.github.v3.diff'"
    )
    result = _run(cmd)
    result.check_returncode()
    return result.stdout.strip()


def _run_tests(repo_dir, test_path):
    """Runs a Python test file inside the repo and returns the CompletedProcess."""
    return _run(f"python3 {shlex.quote(test_path)}", cwd=repo_dir)


def list_open_issues(limit: int = 50) -> str:
    """Returns open issues in the target repo as a JSON array (number, title, author, labels, body, timestamps)."""
    cmd = (
        f"gh issue list --repo {REPO_NAME} --state open --limit {limit} "
        "--json number,title,author,labels,createdAt,updatedAt,body"
    )
    result = _run(cmd)
    result.check_returncode()
    return result.stdout.strip()


def get_issue(number: int) -> str:
    """Returns one issue (with labels, body and comments) as JSON."""
    cmd = (
        f"gh issue view {number} --repo {REPO_NAME} --json "
        "number,title,author,labels,body,createdAt,updatedAt,comments"
    )
    result = _run(cmd)
    result.check_returncode()
    return result.stdout.strip()


def list_issue_comments(number: int) -> str:
    """Returns the full comment thread of an issue as JSON
    [{id, author:{login}, body, createdAt}, ...] (oldest first).

    Used by the watchdog to keep the conversation going: it finds the newest
    human comment that is newer than the last comment the bot already
    answered, so follow-ups on any issue keep getting replies (not just the
    first issue and not just the first reply).
    """
    result = _run(
        f"gh api repos/{REPO_NAME}/issues/{number}/comments "
        "--jq 'sort_by(.id) | map({id, author: {login: .user.login}, "
        "body, createdAt: .created_at}) | tojson'"
    )
    result.check_returncode()
    return result.stdout.strip()


def post_issue_comment(number: int, body: str) -> str:
    """Posts a comment on the issue using a --body-file (safe quoting)."""
    workdir = tempfile.mkdtemp(prefix="orchestr_issue_")
    try:
        body_file = os.path.join(workdir, "issue_comment.md")
        with open(body_file, "w") as f:
            f.write(body)
        result = _run(
            f"gh issue comment {number} --repo {REPO_NAME} "
            f"--body-file {shlex.quote(body_file)}"
        )
        result.check_returncode()
        return result.stdout.strip()
    finally:
        shutil.rmtree(workdir, ignore_errors=True)


def add_issue_labels(number: int, labels: list[str]) -> str:
    """Adds the given labels to an issue (no-op when there are none)."""
    if not labels:
        return ""
    result = _run(
        f"gh issue edit {number} --repo {REPO_NAME} "
        f"--add-label {shlex.quote(','.join(labels))}"
    )
    result.check_returncode()
    return result.stdout.strip()


def list_user_issue_texts(author: str) -> str:
    """Returns a JSON list of public text samples authored by a GitHub user in
    the target repo: issue titles/bodies and issue comment bodies. Used to
    derive an observable communication profile for adapted replies."""
    samples: list[dict] = []
    try:
        result = _run(
            f"gh search issues --repo {REPO_NAME} --author {shlex.quote(author)} "
            "--json title,body --limit 25"
        )
        if result.returncode == 0 and result.stdout.strip():
            for item in json.loads(result.stdout):
                if item.get("title"):
                    samples.append({"kind": "issue", "text": item["title"]})
                if item.get("body"):
                    samples.append({"kind": "issue", "text": item["body"]})
    except Exception:
        pass
    try:
        result = _run(
            f"gh api repos/{REPO_NAME}/issues/comments?per_page=100 --paginate"
        )
        if result.returncode == 0 and result.stdout.strip():
            for comment in json.loads(result.stdout):
                user = (comment.get("user") or {}).get("login", "")
                if user == author and comment.get("body"):
                    samples.append({"kind": "comment", "text": comment["body"]})
    except Exception:
        pass
    return json.dumps(samples[:60])


def create_fix_pr(
    file_path: str,
    file_content: str,
    pr_title: str,
    pr_body: str,
    test_path: str = "",
    test_content: str = "",
) -> str:
    """Clones the repo, applies the fix, runs the test, and opens a PR.

    When test_content is given, the test is committed with the fix and executed
    locally BEFORE anything is pushed; the PR body then receives a
    "Verification & Tests" section with the real test output. Failed tests block
    the PR creation. Returns the PR URL (or the failure report).

    The file paths are relative to the repo root. pr_body is GitHub-flavored
    Markdown supplied by the agent.
    """
    branch = f"fix-incident-{int(time.time())}"
    workdir = tempfile.mkdtemp(prefix="orchestr_repo_")
    repo_dir = os.path.join(workdir, "repo")
    clone_url = _auth_repo_url()

    try:
        _run(f"git clone --quiet {clone_url} repo", cwd=workdir).check_returncode()
        _run(f"git checkout -b {branch}", cwd=repo_dir).check_returncode()

        target = os.path.join(repo_dir, file_path)
        os.makedirs(os.path.dirname(target), exist_ok=True)
        with open(target, "w") as f:
            f.write(file_content)

        if test_content:
            target_test = os.path.join(repo_dir, test_path)
            os.makedirs(os.path.dirname(target_test), exist_ok=True)
            with open(target_test, "w") as f:
                f.write(test_content)
            _run("git add .", cwd=repo_dir).check_returncode()
            _run(
                "git -c user.email=orchestr@localhost -c user.name=Orchestr "
                f"commit -m {shlex.quote('Fix incident: ' + pr_title)}",
                cwd=repo_dir,
            ).check_returncode()

            test_result = _run_tests(repo_dir, target_test)
            if test_result.returncode != 0:
                return (
                    "TEST_FAILED: no PR was created. Review the output, fix the "
                    f"tests or the fix, then call create_fix_pr again.\n\n"
                    f"--- test output ---\n{test_result.stdout}\n{test_result.stderr}"
                )
        else:
            _run("git add .", cwd=repo_dir).check_returncode()
            _run(
                "git -c user.email=orchestr@localhost -c user.name=Orchestr "
                f"commit -m {shlex.quote(pr_title)}",
                cwd=repo_dir,
            ).check_returncode()

        _run(f"git push --quiet origin {branch}", cwd=repo_dir).check_returncode()

        body = pr_body
        if test_content:
            raw = f"{test_result.stdout}{test_result.stderr}".strip()
            output = raw or "(no output — all assertions passed, exit 0)"
            body += (
                "\n\n---\n\n### 🧪 Verification & Tests\n\n"
                f"`$ python3 {shlex.quote(test_path)}`\n\n"
                f"```\n{output}\n```\n\n"
                f"✅ tests passed (exit {test_result.returncode})\n"
            )
        body_file = os.path.join(workdir, "pr_body.md")
        with open(body_file, "w") as f:
            f.write(body)
        result = _run(
            f"gh pr create --title {shlex.quote(pr_title)} "
            f"--body-file {shlex.quote(body_file)} --head {branch}",
            cwd=repo_dir,
        )
        result.check_returncode()

        match = re.search(r"https://github.com/[^\s]+/pull/\d+", result.stdout)
        return match.group(0) if match else result.stdout.strip()
    finally:
        shutil.rmtree(workdir, ignore_errors=True)