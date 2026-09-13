# Personalized Discord Issue Response Agent

An MVP Discord support agent that stores messages, detected issues, and observable communication profiles in local CSV files. It does not require credentials for its API and test workflow.

## Run locally

```bash
uv sync --extra dev
uv run uvicorn app.main:app --reload
```

Open `http://127.0.0.1:8000/docs` for the FastAPI interface. Local data is created under `data/messages.csv`, `data/issues.csv`, and `data/user_profiles.csv`.

## Discord (optional)

Copy `.env.example` to `.env`, add `DISCORD_BOT_TOKEN`, then install the optional Discord dependency:

```bash
uv sync --extra discord --extra dev
uv run python -c "from app.discord.bot import run_bot; run_bot()"
```

Enable the Message Content Intent for the bot in the Discord developer portal. The Google ADK adapter is optional and can be installed with `uv sync --extra adk`; the MVP response path remains deterministic until you wire a configured ADK runner.

## API flow

`POST /messages` stores every message. Ordinary messages stop there. Messages with issue indicators create an issue. Before a personalized reply is generated, explicit consent is required: in Discord the bot asks the user to reply `yes` or `no`; in the API, send `personalization_consent: true` to `POST /issues/respond`. With consent, the agent uses only observable preferences derived from stored messages (such as concise versus detailed wording and a preference for steps). It does not impersonate the user or infer sensitive traits.
