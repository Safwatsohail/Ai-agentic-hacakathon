FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1

WORKDIR /app

# Install git, gh cli, and curl
RUN apt-get update && apt-get install -y git curl gnupg \
    && curl -fsSL https://cli.github.com/packages/githubcli-archive-keyring.gpg | dd of=/usr/share/keyrings/githubcli-archive-keyring.gpg \
    && chmod go+r /usr/share/keyrings/githubcli-archive-keyring.gpg \
    && echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main" | tee /etc/apt/sources.list.d/github-cli.list > /dev/null \
    && apt-get update && apt-get install -y gh \
    && useradd -m -u 1000 orchestr \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY --chown=orchestr:orchestr . .

USER orchestr

# Keep the container alive or run the agent
CMD ["python", "-u", "agent.py"]
