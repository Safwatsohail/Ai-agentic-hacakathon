import asyncio
import os

import pytest
from fastapi.testclient import TestClient

# Resolve the module path so `main` imports resolve in the container.
os.environ.setdefault("PYTHONPATH", "/app")

import main  # noqa: E402  (env/DATABASE_URL already set by conftest)

# Never dial Discord from tests.
main.client.start = lambda *a, **k: asyncio.sleep(0)
main.client.get_channel = lambda *a, **k: None


@pytest.fixture(scope="module")
def client():
    with TestClient(main.app) as test_client:
        yield test_client


def test_issues_start_empty(client):
    assert client.get("/api/issues").json() == []


def test_issue_result_creates_row(client):
    resp = client.post(
        "/api/issues/101/result",
        json={"category": "bug", "severity": "medium", "status": "handled", "reply": "guidance text"},
    )
    assert resp.status_code == 200
    body = resp.json()
    assert body["issue_number"] == 101
    assert body["category"] == "bug"
    assert body["status"] == "handled"


def test_promote_creates_incident(client):
    resp = client.post("/api/issues/102/promote", json={"category": "bug"})
    assert resp.status_code == 200
    incident_id = resp.json()["incident_id"]
    assert incident_id.startswith("inc_")

    issue = client.get("/api/issues/102").json()
    assert issue["incident_id"] == incident_id
    assert issue["status"] == "promoted"

    incident = client.get(f"/api/incidents/{incident_id}").json()
    assert incident["id"] == incident_id
    assert "issue #102" in incident["title"]


def test_promote_is_idempotent(client):
    first = client.post("/api/issues/102/promote", json={}).json()["incident_id"]
    second = client.post("/api/issues/102/promote", json={}).json()["incident_id"]
    assert first == second


def test_scan_state_merge(client):
    client.post("/api/issues/scan-state", json={"repo": "repo/one", "processed": [1, 2]})
    client.post("/api/issues/scan-state", json={"repo": "repo/one", "processed": [2, 3]})
    state = client.get("/api/issues/scan-state", params={"repo": "repo/one"}).json()
    assert state["processed"] == [1, 2, 3]


def test_profile_round_trip(client):
    profile = {"user_id": "alice", "style": {"verbosity": "detailed"}, "evidence_count": 5}
    client.post("/api/users/alice/profile", json={"profile": profile})
    got = client.get("/api/users/alice/profile").json()["profile"]
    assert got["style"]["verbosity"] == "detailed"
    assert got["evidence_count"] == 5
    assert got["updated_at"] is not None


def test_profile_missing_returns_null(client):
    got = client.get("/api/users/nobody/profile").json()["profile"]
    assert got is None


def test_announce_posts_to_channel_and_logs(client, monkeypatch):
    sent = {}

    class FakeChannel:
        async def send(self, text):
            sent["text"] = text

    monkeypatch.setattr(main.client, "get_channel", lambda cid: FakeChannel())

    incident_id = client.post("/api/issues/103/promote", json={"category": "bug"}).json()["incident_id"]
    msg = "On it — looking at the latest commits 👀"
    resp = client.post(
        f"/api/incidents/{incident_id}/announce", json={"message": msg}
    )
    assert resp.status_code == 200
    assert "On it" in sent["text"]

    led = client.get(f"/api/incidents/{incident_id}").json()["ledger"]
    assert any(
        s["step"] == "discord_update" and s["message"] == msg for s in led
    )


def test_announce_survives_discord_offline(client):
    # get_channel returns None (module default); the partial-messageable send
    # raises against a dead client — the endpoint must still log and return ok.
    incident_id = client.post("/api/issues/104/promote", json={}).json()["incident_id"]
    resp = client.post(
        f"/api/incidents/{incident_id}/announce",
        json={"message": "still updating the ledger", "channel": "dev"},
    )
    assert resp.status_code == 200

    led = client.get(f"/api/incidents/{incident_id}").json()["ledger"]
    assert any(s["step"] == "discord_update" for s in led)