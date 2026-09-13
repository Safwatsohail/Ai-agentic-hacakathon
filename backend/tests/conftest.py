import os

# These MUST be set before `main` / `db` are imported anywhere. Forced (not
# setdefault) so the container's postgres env cannot leak into the tests.
os.environ["DATABASE_URL"] = "sqlite:///./test_orchestr.db"
os.environ["DISCORD_BOT_TOKEN"] = ""
os.environ["DISCORD_INCIDENT_CHANNEL_ID"] = "0"
os.environ["DISCORD_DEV_CHANNEL_ID"] = "0"

pytest_plugins = []