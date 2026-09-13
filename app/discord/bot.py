from __future__ import annotations

import os
import logging

import certifi
from dotenv import load_dotenv

load_dotenv()
# Use the virtual environment's maintained CA bundle for Discord HTTPS requests.
os.environ.setdefault("SSL_CERT_FILE", certifi.where())

logger = logging.getLogger(__name__)


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
    from app.storage.models import DiscordMessage

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
        issue, _ = service.ingest(record)
        if issue:
            profile = ProfileUpdater(store).get_or_refresh(issue.user_id)
            response = ResponseAgent().generate(ContextRetriever(store).retrieve(issue), profile)
            checked = ResponseValidator().validate(response, issue.summary)
            if not checked.valid:
                logger.warning("Response validation failed for issue %s: %s", issue.issue_id, "; ".join(checked.reasons))
            await message.reply(checked.cleaned_response if checked.valid else ResponseValidator.fallback(), mention_author=False)
        await bot.process_commands(message)
    return bot


def run_bot() -> None:
    token = os.getenv("DISCORD_BOT_TOKEN")
    if not token:
        raise RuntimeError("DISCORD_BOT_TOKEN is not set.")
    create_bot().run(token)


if __name__ == "__main__":
    run_bot()
