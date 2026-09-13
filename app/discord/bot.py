from __future__ import annotations

import os
import logging

import certifi
from dotenv import load_dotenv

load_dotenv()
# Use the virtual environment's maintained CA bundle for Discord HTTPS requests.
os.environ.setdefault("SSL_CERT_FILE", certifi.where())

logger = logging.getLogger(__name__)

CONSENT_PROMPT = (
    "Before I prepare a personalized support reply, may I use the communication preferences "
    "derived from your messages in this server? Reply `yes` to continue or `no` to use no personalization."
)
YES_RESPONSES = {"yes", "y", "yes please", "i agree", "i consent"}
NO_RESPONSES = {"no", "n", "no thanks", "i decline"}


def create_bot():
    try:
        import discord
        from discord.ext import commands
    except ImportError as exc:
        raise RuntimeError("Install the Discord extra with: uv sync --extra discord") from exc

    from app.agent.agent import ResponseAgent
    from app.context.retrieval import ContextRetriever
    from app.issue.classifier import IssueService
    from app.personalization.updater import ProfileUpdater
    from app.response.validator import ResponseValidator
    from app.storage.database import CsvStore
    from app.storage.models import DiscordMessage, IssueStatus

    store = CsvStore()
    service = IssueService(store)
    intents = discord.Intents.default()
    intents.message_content = True
    bot = commands.Bot(command_prefix="!", intents=intents)

    @bot.event
    async def on_message(message):
        if message.author.bot:
            return
        record = DiscordMessage(message_id=str(message.id), user_id=str(message.author.id), channel_id=str(message.channel.id), content=message.content, author_name=message.author.display_name)
        consent_answer = message.content.lower().strip()
        pending_issue = store.find_pending_consent_issue(record.user_id, record.channel_id)
        if pending_issue and consent_answer in YES_RESPONSES:
            store.store_message(record)
            profile = ProfileUpdater(store).refresh(pending_issue.user_id)
            response = ResponseAgent().generate(ContextRetriever(store).retrieve(pending_issue), profile)
            checked = ResponseValidator().validate(response, pending_issue.summary)
            store.update_issue_status(pending_issue.issue_id, IssueStatus.RESPONDED)
            await message.reply(checked.cleaned_response if checked.valid else ResponseValidator.fallback(), mention_author=False)
            return
        if pending_issue and consent_answer in NO_RESPONSES:
            store.store_message(record)
            store.update_issue_status(pending_issue.issue_id, IssueStatus.DECLINED)
            await message.reply("Understood. I won't use your communication profile for this request.", mention_author=False)
            return
        issue, _ = service.ingest(record)
        if issue:
            store.update_issue_status(issue.issue_id, IssueStatus.CONSENT_PENDING)
            await message.reply(CONSENT_PROMPT, mention_author=False)
        await bot.process_commands(message)
    return bot


def run_bot() -> None:
    token = os.getenv("DISCORD_BOT_TOKEN")
    if not token:
        raise RuntimeError("DISCORD_BOT_TOKEN is not set.")
    create_bot().run(token)


if __name__ == "__main__":
    run_bot()
