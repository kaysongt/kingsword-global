FROM python:3.12-slim-bookworm
WORKDIR /app
COPY requirements.txt .
RUN apt-get update && apt-get install -y --no-install-recommends chromium ca-certificates && rm -rf /var/lib/apt/lists/*
RUN pip install --no-cache-dir -r requirements.txt
COPY server.py .
ENV CHECKIN_DATA=/data CHROMIUM_PATH=/usr/bin/chromium
CMD ["sh","-c","exec uvicorn server:app --host 0.0.0.0 --port ${PORT:-8080} --no-access-log --no-proxy-headers"]
