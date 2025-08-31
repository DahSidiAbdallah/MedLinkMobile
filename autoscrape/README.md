# autoscrape v2

A pragmatic scraper/crawler with:
- **JS rendering (Playwright)** for SPA/JS-heavy pages
- **Request caching** (requests-cache, SQLite by default)
- **YAML config** for per-site rules (selectors, include/exclude, render patterns, etc.)

> ⚠️ Use responsibly. Respect robots.txt, Terms of Service, and privacy laws.

## Install
```bash
python -m venv .venv
# Windows: .venv\Scripts\activate
# macOS/Linux:
source .venv/bin/activate
pip install -r requirements.txt

# Install Playwright browsers once:
python -m playwright install
# (Firefox engine used by default; you can switch in code if desired)
```

## Quick start (CLI-only)
```bash
python autoscrape.py "https://example.com" \
  --same-domain-only --max-pages 30 --max-depth 2 \
  --use-js --render-pattern "example\.com/(news|shop)/" \
  --cache --cache-expire 86400 \
  --select "title:h1, price:.price"
```

## YAML config
Create `config.yaml` like this:
```yaml
start_url: "https://example.com"
max_pages: 50
max_depth: 2
same_domain_only: true
delay: 0.7
ignore_robots: false

selectors:
  title: "h1"
  price: ".price"

include_urls:
  - "example\.com/(news|shop)"
exclude_urls:
  - "\?replytocom="

render:
  use_js: true
  timeout_ms: 15000
  # Render only URLs that match these regexes (omit list to render all when enabled)
  url_patterns:
    - "example\.com/(news|shop)"
    - "example\.com/product/.+"

cache:
  enabled: true
  backend: "sqlite"
  expire_after: 86400   # seconds
  path: "http_cache"
```

Run with config:
```bash
python autoscrape.py --config config.yaml
```
CLI flags override the YAML.

## Outputs
- `autoscrape.jsonl` → full per-page JSON
- `autoscrape.csv` → compact summary table

## Notes
- **Rendering**: If `render.use_js: true` and no `url_patterns` are set, all pages render via Playwright (slower). If you set `url_patterns`, only matching URLs render.
- **Caching**: speeds up re-runs and avoids hammering servers. Use `--cache-expire` or YAML `expire_after` to control freshness.
- For extremely dynamic sites, you may need site-specific waits (e.g., waiting for a selector). That can be added per site if needed.

## Docker (run full autoscrape with system deps)

To avoid installing native build toolchains on Windows, you can run the full autoscrape stack in Docker. The included `Dockerfile` builds libxml2/libxslt and Playwright browsers so the service is self-contained.

Build and run:

```bash
cd autoscrape
docker-compose build --no-cache
docker-compose up -d
```

The Flask wrapper will be exposed on port 5001 by default:

```bash
curl -i "http://localhost:5001/scrape?code=68210-0800"
```

If you run the app on a phone, set `SCRAPER_BASE_URL` to `http://<your-machine-ip>:5001` so the phone can reach the container.
