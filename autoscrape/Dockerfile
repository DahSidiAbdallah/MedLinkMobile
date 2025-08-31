# Full autoscrape service image
# Builds all native deps (libxml2/libxslt), installs Python deps and Playwright browsers
FROM python:3.11-slim

ENV DEBIAN_FRONTEND=noninteractive

RUN apt-get update \
  && apt-get install -y --no-install-recommends \
     build-essential \
     ca-certificates \
     wget \
     curl \
     gnupg \
     libxml2-dev \
     libxslt1-dev \
     libssl-dev \
     libffi-dev \
     libjpeg-dev \
     zlib1g-dev \
  && rm -rf /var/lib/apt/lists/*

# Copy requirements and install python deps
WORKDIR /app
COPY autoscrape/requirements.txt /app/requirements.txt
RUN pip install --no-cache-dir -r /app/requirements.txt

# Install Playwright browsers (if playwright present)
# Use playwright CLI to install browsers and system deps
RUN python -m playwright install --with-deps || true

# Copy the full autoscrape package
COPY autoscrape /app/autoscrape
WORKDIR /app/autoscrape

EXPOSE 5001

# Run the Flask wrapper on container start
CMD ["python", "scraper_api.py"]
