FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1

WORKDIR /app

RUN apt-get update && apt-get install -y gcc libpq-dev \
    && useradd -m -u 1000 orchestr \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY --chown=orchestr:orchestr . .

USER orchestr

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
