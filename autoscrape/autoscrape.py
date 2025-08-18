#!/usr/bin/env python3
# autoscrape.py (v2: JS rendering + cache + YAML config)

import argparse
import json
import re
import time
import sys
import csv
from urllib.parse import urljoin, urlparse, urldefrag
from collections import deque
import glob
try:
    import openpyxl
except ImportError:
    openpyxl = None


import requests
from bs4 import BeautifulSoup
from bs4.element import Tag
from readability import Document
from urllib import robotparser
import yaml
try:
    from selectolax.parser import HTMLParser as SelectolaxParser
except ImportError:
    SelectolaxParser = None

# Optional: requests-cache
try:
    import requests_cache
except ImportError:
    requests_cache = None

DEFAULT_HEADERS = {
    "User-Agent": "autoscrape/2.0 (+https://example.com; educational use)",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.9",
}

BIN_EXTENSIONS = {".jpg",".jpeg",".png",".gif",".webp",".svg",".ico",".pdf",".zip",".rar",".7z",".mp4",".webm",".mp3",".wav",".ogg",".ttf",".woff",".woff2",".eot",".exe",".dmg",".apk",".msi"}

EMAIL_RE = re.compile(r'[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}', re.I)
PHONE_RE = re.compile(r'(\+\d{1,3}\s?)?(\(?\d{2,4}\)?[\s.-]?)?\d{3,4}[\s.-]?\d{3,4}')

def is_probably_binary(url: str) -> bool:
    path = urlparse(url).path.lower()
    for ext in BIN_EXTENSIONS:
        if path.endswith(ext):
            return True
    return False

def same_domain(a: str, b: str) -> bool:
    return urlparse(a).netloc == urlparse(b).netloc

def clean_url(url: str) -> str:
    url, _ = urldefrag(url)
    parsed = urlparse(url)
    scheme = parsed.scheme or "http"
    return parsed._replace(scheme=scheme).geturl()

def extract_meta(soup: BeautifulSoup) -> dict:
    meta = {}
    if soup.title and soup.title.string:
        meta["title"] = soup.title.string.strip()
    desc = soup.find("meta", attrs={"name": "description"})
    if desc and desc.get("content"):
        meta["meta_description"] = desc["content"].strip()
    for prop in ["og:title","og:description","og:type","og:url","og:image"]:
        tag = soup.find("meta", property=prop)
        if tag and tag.get("content"):
            meta[prop] = tag["content"].strip()
    for name in ["twitter:title","twitter:description","twitter:image"]:
        tag = soup.find("meta", attrs={"name": name})
        if tag and tag.get("content"):
            meta[name] = tag["content"].strip()
    link = soup.find("link", rel=lambda v: v and "canonical" in v)
    if link and link.get("href"):
        meta["canonical"] = link["href"].strip()
    return meta

def extract_headings(soup: BeautifulSoup) -> dict:
    headings = {}
    for level in range(1,7):
        tags = [t.get_text(strip=True) for t in soup.find_all(f"h{level}")]
        if tags:
            headings[f"h{level}"] = tags
    return headings

def extract_links(soup: BeautifulSoup, base_url: str) -> dict:
    links = []
    images = []
    for a in soup.find_all("a", href=True):
        href = urljoin(base_url, a["href"].strip())
        txt = a.get_text(strip=True) or None
        links.append({"href": href, "text": txt})
    for img in soup.find_all("img", src=True):
        src = urljoin(base_url, img["src"].strip())
        alt = img.get("alt")
        images.append({"src": src, "alt": alt})
    return {"links": links, "images": images}

def extract_tables(soup: BeautifulSoup) -> list:
    tables = []
    for table in soup.find_all("table"):
        rows = []
        for tr in table.find_all("tr"):
            cells = [c.get_text(strip=True) for c in tr.find_all(["th","td"])]
            if cells:
                rows.append(cells)
        if rows:
            tables.append(rows)
    return tables

def extract_json_ld(soup: BeautifulSoup) -> list:
    data = []
    for script in soup.find_all("script", type="application/ld+json"):
        try:
            txt = script.string or script.get_text()
            if not txt:
                continue
            obj = json.loads(txt)
            data.append(obj)
        except Exception:
            continue
    return data

def extract_emails_phones(text: str) -> dict:
    emails = sorted(set(EMAIL_RE.findall(text)))
    # Flatten PHONE_RE results (which may be tuples from groups)
    phones_found = PHONE_RE.findall(text)
    flat = []
    for p in phones_found:
        if isinstance(p, tuple):
            joined = " ".join([seg for seg in p if seg]).strip()
            if joined:
                flat.append(joined)
        elif isinstance(p, str):
            flat.append(p.strip())
    phones = sorted(set(flat))
    return {"emails": emails, "phones": phones}

def extract_readable(html: str, url: str) -> dict:
    try:
        doc = Document(html)
        summary_html = doc.summary(html_partial=True)
        title = doc.short_title()
        soup = BeautifulSoup(summary_html, "html.parser")
        text = soup.get_text("\n", strip=True)
        return {"readability_title": title, "readability_text": text}
    except Exception:
        return {}

def flatten_for_csv(item: dict) -> dict:
    # This function is no longer used for the main export, but kept for summary exports if needed
    out = {
        "url": item.get("url"),
        "status": item.get("status"),
        "title": item.get("meta", {}).get("title"),
        "meta_description": item.get("meta", {}).get("meta_description"),
        "readability_title": item.get("readability", {}).get("title"),
        "n_links": len(item.get("links", {}).get("links", [])),
        "n_images": len(item.get("links", {}).get("images", [])),
        "n_tables": len(item.get("tables", [])),
        "n_jsonld": len(item.get("json_ld", [])),
        "n_emails": len(item.get("contacts", {}).get("emails", [])),
        "n_phones": len(item.get("contacts", {}).get("phones", [])),
    }
    custom = item.get("custom", {})
    if isinstance(custom, dict):
        for k, v in custom.items():
            if isinstance(v, list):
                out[k] = ", ".join(str(x) for x in v)
            else:
                out[k] = v
    return out

def apply_selectors(soup: BeautifulSoup, selector_map: dict) -> dict:
    extracted = {}
    for field, css in selector_map.items():
        nodes = soup.select(css)
        vals = []
        for n in nodes:
            if isinstance(n, Tag):
                if n.name == "img" and n.get("src"):
                    vals.append(n["src"])
                else:
                    vals.append(n.get_text(strip=True))
        extracted[field] = vals
    return extracted

def extruct_extract(html: str, url: str) -> dict:
    """Extract structured data using extruct."""
    try:
        import extruct
        from lxml import html as lxml_html
        tree = lxml_html.fromstring(html)
        data = extruct.extract(html, base_url=url, syntaxes=["json-ld","microdata","opengraph","rdfa"])
        return data
    except Exception as e:
        return {"error": str(e)}

def trafilatura_extract(html: str) -> dict:
    """Extract main content using trafilatura."""
    try:
        import trafilatura
        result = trafilatura.extract(html, output_format="json", with_metadata=True)
        if result:
            import json as _json
            return _json.loads(result)
        else:
            return {}
    except Exception as e:
        return {"error": str(e)}

def ai_autodetect_extract(html: str, export_raw_html: bool = False, url: str = None) -> dict:
    """AI/heuristic extraction of repeated cards, titles, prices, links, headlines, dates, authors, etc. using selectolax and regexes."""
    if SelectolaxParser is None:
        return {}
    import re
    tree = SelectolaxParser(html)
    out = {}
    # Optionally export raw HTML for further analysis
    if export_raw_html:
        out["raw_html"] = html
    # Find repeated card-like elements (div, li, article, section, tr)
    card_candidates = []
    for tag in ("div", "li", "article", "section", "tr"):
        for node in tree.css(tag):
            # Heuristic: many siblings, enough text, or has links/images
            if node.parent and hasattr(node.parent, "child_nodes") and len([c for c in node.parent.child_nodes if c.tag is not None]) > 5:
                if len(node.text(strip=True)) > 20 or node.css("a,img"):
                    card_candidates.append(node)
    # Try to extract fields from cards
    cards = []
    for card in card_candidates:
        card_data = {}
        # Title/headline: h1/h2/h3/strong/b or first long text
        title = ""
        for t in card.css("h1,h2,h3,strong,b"):  # headline
            txt = t.text(strip=True)
            if txt and len(txt) > 3:
                title = txt
                break
        if not title:
            txt = card.text(strip=True)
            if txt and len(txt) > 10:
                title = txt.split("\n")[0]
        if title:
            card_data["title"] = title
        # Price: look for numbers with currency, DH, $, €, د.م, etc.
        price = ""
        for t in card.css("span,div"):
            txt = t.text(strip=True)
            if re.search(r"\d+[\s\u202f]*(DH|د\.م|\$|€|USD|MAD)", txt):
                price = txt
                break
        if price:
            card_data["price"] = price
        # Link: look for <a href>
        link = ""
        for a in card.css("a"):
            href = a.attributes.get("href")
            if href and (href.startswith("http") or href.startswith("/")):
                link = href
                break
        if link:
            card_data["link"] = link
        # Date: look for date/time patterns
        date = ""
        for t in card.css("span,div,time"):
            txt = t.text(strip=True)
            if re.search(r"\d{1,2}/\d{1,2}/\d{2,4}", txt) or re.search(r"\d{4}-\d{2}-\d{2}", txt):
                date = txt
                break
        if date:
            card_data["date"] = date
        # Author: look for class/id with 'author', 'user', 'by', etc.
        author = ""
        for t in card.css("*[class*='author'], *[id*='author'], *[class*='user'], *[id*='user'], *[class*='by'], *[id*='by']"):
            txt = t.text(strip=True)
            if txt and len(txt) > 2:
                author = txt
                break
        if author:
            card_data["author"] = author
        # Image: first <img src>
        img = ""
        for im in card.css("img"):
            src = im.attributes.get("src")
            if src:
                img = src
                break
        if img:
            card_data["image"] = img
        # Description: first <p> or long text
        desc = ""
        for p in card.css("p"):
            txt = p.text(strip=True)
            if txt and len(txt) > 10:
                desc = txt
                break
        if not desc:
            txt = card.text(strip=True)
            if txt and len(txt) > 30:
                desc = txt
        if desc:
            card_data["desc"] = desc
        # Only add if at least one field found
        if card_data:
            cards.append(card_data)
    if cards:
        out["cards"] = cards
    # Fallback: main content, tables, lists
    out.update(smart_extract(html))
    # Add extruct and trafilatura extraction
    if url:
        out["extruct"] = extruct_extract(html, url)
    out["trafilatura"] = trafilatura_extract(html)
    return out

def smart_extract(html: str) -> dict:
    """Automatic extraction of main content, tables, and lists using selectolax."""
    if SelectolaxParser is None:
        return {}
    tree = SelectolaxParser(html)
    out = {}
    # Main content: largest text block
    main_text = ""
    max_len = 0
    for node in tree.body.iter():
        if node.tag in ("div", "main", "section", "article"):
            txt = node.text(strip=True)
            if len(txt) > max_len:
                main_text = txt
                max_len = len(txt)
    if main_text:
        out["main_text"] = main_text
    # Tables
    tables = []
    for table in tree.css("table"):
        rows = []
        for tr in table.css("tr"):
            cells = [td.text(strip=True) for td in tr.css("th,td")]
            if cells:
                rows.append(cells)
        if rows:
            tables.append(rows)
    if tables:
        out["tables"] = tables
    # Lists
    lists = []
    for ul in tree.css("ul,ol"):
        items = [li.text(strip=True) for li in ul.css("li") if li.text(strip=True)]
        if items:
            lists.append(items)
    if lists:
        out["lists"] = lists
    return out

# ---------------- JS Renderer (Playwright) ----------------

class JSRenderer:
    def __init__(self, enabled=False, timeout_ms=15000, wait_config=None):
        self.enabled = enabled
        self.timeout_ms = timeout_ms
        self.wait_config = wait_config or {}
        self._pl = None  # playwright context
        self._browser = None

    def _ensure(self):
        if not self.enabled:
            return False
        if self._pl is None:
            try:
                from playwright.sync_api import sync_playwright
                self._pl = sync_playwright().start()
                # Use Firefox; change to chromium or webkit as desired
                self._browser = self._pl.firefox.launch(headless=True)
            except Exception as e:
                sys.stderr.write(f"[warn] Playwright not available or browsers not installed. Run: python -m playwright install\n{e}\n")
                self.enabled = False
                return False
        return True

    def fetch_html(self, url: str, selectors: dict = None) -> str:
        if not self._ensure():
            return None
        try:
            ctx = self._browser.new_context(user_agent=DEFAULT_HEADERS["User-Agent"])
            page = ctx.new_page()
            page.set_default_timeout(self.timeout_ms)
            page.goto(url, wait_until="domcontentloaded")
            # Wait logic: per-site or per-selector
            wait_time = 0
            wait_for_selectors = []
            if self.wait_config:
                # Global wait
                wait_time = self.wait_config.get("wait_time", 0)
                # Per-site wait (by regex)
                if "site_patterns" in self.wait_config:
                    import re
                    for pat, val in self.wait_config["site_patterns"].items():
                        if re.search(pat, url):
                            wait_time = max(wait_time, val.get("wait_time", 0))
                            if "wait_for_selectors" in val:
                                wait_for_selectors.extend(val["wait_for_selectors"])
                # Per-selector wait
                if selectors and "selector_waits" in self.wait_config:
                    for field, css in selectors.items():
                        if field in self.wait_config["selector_waits"]:
                            wait_for_selectors.append(self.wait_config["selector_waits"][field])
            # Wait for selectors if specified
            for sel in wait_for_selectors:
                try:
                    page.wait_for_selector(sel, timeout=self.timeout_ms)
                except Exception:
                    pass
            if wait_time > 0:
                import time as _t
                _t.sleep(wait_time)
            try:
                page.wait_for_load_state("networkidle", timeout=self.timeout_ms)
            except Exception:
                pass
            html = page.content()
            ctx.close()
            return html
        except Exception as e:
            sys.stderr.write(f"[warn] Playwright fetch failed: {e}\n")
            return None

    def close(self):
        if self._browser:
            self._browser.close()
        if self._pl:
            self._pl.stop()
        self._browser = None
        self._pl = None

# -------- Crawler --------

def can_fetch(url: str, rp: robotparser.RobotFileParser, ignore_robots: bool) -> bool:
    if ignore_robots:
        return True
    try:
        return rp.can_fetch(DEFAULT_HEADERS["User-Agent"], url)
    except Exception:
        return True

def build_robot_parser(start_url: str) -> robotparser.RobotFileParser:
    parsed = urlparse(start_url)
    robots_url = f"{parsed.scheme}://{parsed.netloc}/robots.txt"
    rp = robotparser.RobotFileParser()
    try:
        rp.set_url(robots_url)
        rp.read()
    except Exception:
        pass
    return rp

def url_allowed(url: str, include_patterns, exclude_patterns) -> bool:
    if exclude_patterns:
        for pat in exclude_patterns:
            if re.search(pat, url):
                return False
    if include_patterns:
        for pat in include_patterns:
            if re.search(pat, url):
                return True
        return False
    return True

def build_session(cfg_cache: dict):
    if cfg_cache and cfg_cache.get("enabled") and requests_cache is not None:
        backend = cfg_cache.get("backend","sqlite")
        expire = cfg_cache.get("expire_after", 86400)
        cache_name = cfg_cache.get("path","http_cache")
        return requests_cache.CachedSession(cache_name=cache_name, backend=backend, expire_after=expire)
    s = requests.Session()
    return s

def fetch(session: requests.Session, url: str, timeout: int = 15, retries: int = 2, retry_delay: float = 1.0):
    last_exc = None
    for attempt in range(retries + 1):
        try:
            resp = session.get(url, headers=DEFAULT_HEADERS, timeout=timeout)
            ct = resp.headers.get("Content-Type","").lower()
            if "text/html" not in ct and "application/xhtml+xml" not in ct and "text/" not in ct:
                return None, resp.status_code
            resp.encoding = resp.encoding or resp.apparent_encoding or "utf-8"
            return resp.text, resp.status_code
        except Exception as e:
            import sys
            sys.stderr.write(f"[error] Fetch failed for {url} (attempt {attempt+1}/{retries+1}): {e}\n")
            last_exc = e
            if attempt < retries:
                import time as _t
                _t.sleep(retry_delay)
    return None, None

def find_pagination_links(soup, base_url):
    """Auto-detect pagination links (Next, page numbers, rel=next, etc.)."""
    links = set()
    # rel="next"
    for a in soup.find_all("a", rel=True):
        if "next" in a["rel"]:
            href = a.get("href")
            if href:
                links.add(urljoin(base_url, href))
    # Text-based: Next, Suivant, >, »
    for a in soup.find_all("a"):
        txt = a.get_text(strip=True).lower()
        if txt in ("next", "suivant", ">", "»") or re.match(r"^\d+$", txt):
            href = a.get("href")
            if href:
                links.add(urljoin(base_url, href))
    return list(links)
    import concurrent.futures
    max_pages = int(config.get("max_pages", 50))
    max_depth = int(config.get("max_depth", 2))
    same_domain_only = bool(config.get("same_domain_only", False))
    delay = float(config.get("delay", 0.5))
    ignore_robots = bool(config.get("ignore_robots", False))
    selectors = config.get("selectors", {}) or {}
    include_patterns = config.get("include_urls", []) or []
    exclude_patterns = config.get("exclude_urls", []) or []
    render_cfg = config.get("render", {}) or {}
    wait_config = config.get("wait", {}) or {}
    retry_cfg = config.get("retry", {}) or {}
    retries = int(retry_cfg.get("retries", 2))
    retry_delay = float(retry_cfg.get("retry_delay", 1.0))
    cache_cfg = config.get("cache", {}) or {}

    start_url = clean_url(start_url)
    rp = build_robot_parser(start_url)
    seen = set()
    q = deque()
    q.append((start_url, 0))
    out_items = []
    start_domain = urlparse(start_url).netloc

    session = build_session(cache_cfg)
    renderer = JSRenderer(
        enabled=bool(render_cfg.get("use_js", False)),
        timeout_ms=int(render_cfg.get("timeout_ms", 15000)),
        wait_config=wait_config
    )
    render_patterns = render_cfg.get("url_patterns", []) or []

def crawl(start_url, config):
    import concurrent.futures
    from collections import deque
    max_pages = int(config.get("max_pages", 50))
    max_depth = int(config.get("max_depth", 2))
    same_domain_only = bool(config.get("same_domain_only", False))
    delay = float(config.get("delay", 0.5))
    ignore_robots = bool(config.get("ignore_robots", False))
    selectors = config.get("selectors", {}) or {}
    include_patterns = config.get("include_urls", []) or []
    exclude_patterns = config.get("exclude_urls", []) or []
    render_cfg = config.get("render", {}) or {}
    wait_config = config.get("wait", {}) or {}
    retry_cfg = config.get("retry", {}) or {}
    retries = int(retry_cfg.get("retries", 2))
    retry_delay = float(retry_cfg.get("retry_delay", 1.0))
    cache_cfg = config.get("cache", {}) or {}

    start_url = clean_url(start_url)
    rp = build_robot_parser(start_url)
    seen = set()
    q = deque()
    q.append((start_url, 0))
    out_items = []
    start_domain = urlparse(start_url).netloc

    session = build_session(cache_cfg)
    renderer = JSRenderer(
        enabled=bool(render_cfg.get("use_js", False)),
        timeout_ms=int(render_cfg.get("timeout_ms", 15000)),
        wait_config=wait_config
    )
    render_patterns = render_cfg.get("url_patterns", []) or []

    def process_url(url, depth):
        html = None
        status = None
        should_render = False
        if renderer.enabled:
            if not render_patterns:
                should_render = True
            else:
                should_render = any(re.search(p, url) for p in render_patterns)

        if should_render:
            html = renderer.fetch_html(url, selectors=selectors)
            status = 200 if html else None

        if html is None:
            html, status = fetch(session, url, retries=retries, retry_delay=retry_delay)

        item = {"url": url, "status": status}
        pagination_links = []
        if html:
            soup = BeautifulSoup(html, "html.parser")
            item["meta"] = extract_meta(soup)
            item["headings"] = extract_headings(soup)
            item["links"] = extract_links(soup, url)
            item["tables"] = extract_tables(soup)
            item["json_ld"] = extract_json_ld(soup)
            text = soup.get_text("\n", strip=True)
            item["contacts"] = extract_emails_phones(text)
            item["readability"] = extract_readable(html, url)
            # Dynamic pagination detection
            pagination_cfg = config.get("pagination", {})
            next_selector = pagination_cfg.get("next_selector")
            if next_selector:
                for a in soup.select(next_selector):
                    href = a.get("href")
                    if href:
                        pagination_links.append(urljoin(url, href))
            else:
                pagination_links = find_pagination_links(soup, url)

            # Always run AI/ML extractors if enabled
            always_ai = config.get("always_run_ai_extractors", False)
            ai_mode = config.get("ai_autodetect", False) or always_ai
            export_raw_html = config.get("ai_export_raw_html", False)
            if ai_mode:
                item["ai_autodetect"] = ai_autodetect_extract(html, export_raw_html=export_raw_html, url=url)

            # Custom selectors
            selectors_empty = not selectors or all(not v for v in selectors.values())
            custom = None
            if selectors and not selectors_empty:
                custom = apply_selectors(soup, selectors)
                if all(not v for v in custom.values()):
                    custom = None
            if custom:
                item["custom"] = custom

            # Smart extraction fallback
            smart_mode = config.get("smart", False)
            if smart_mode:
                item["smart"] = smart_extract(html)

        item["pagination_links"] = pagination_links
        return item

    try:
        with concurrent.futures.ThreadPoolExecutor(max_workers=5) as executor:
            futures = {}
            while q and len(out_items) < max_pages:
                batch = []
                # Collect a batch of URLs to process in parallel
                while q and len(batch) < 5 and len(out_items) + len(batch) < max_pages:
                    url, depth = q.popleft()
                    if url in seen:
                        continue
                    seen.add(url)
                    if is_probably_binary(url):
                        continue
                    if same_domain_only and not same_domain(url, start_url):
                        continue
                    if not url_allowed(url, include_patterns, exclude_patterns):
                        continue
                    if not can_fetch(url, rp, ignore_robots):
                        continue
                    batch.append((url, depth))

                # Submit batch to executor
                for url, depth in batch:
                    futures[executor.submit(process_url, url, depth)] = (url, depth)

                # As each finishes, process results and enqueue new links
                for future in concurrent.futures.as_completed(list(futures.keys())):
                    url, depth = futures[future]
                    try:
                        item = future.result()
                    except Exception as exc:
                        item = {"url": url, "status": None, "error": str(exc)}
                    out_items.append(item)
                    # Only parse links if we have HTML and depth < max_depth
                    if item.get("links") and depth < max_depth:
                        for link in item["links"]["links"]:
                            href = clean_url(link["href"])
                            if same_domain_only and urlparse(href).netloc != start_domain:
                                continue
                            if href not in seen and url_allowed(href, include_patterns, exclude_patterns):
                                q.append((href, depth+1))
                    # Enqueue pagination links (if any) at same depth
                    if item.get("pagination_links") and depth < max_depth:
                        for href in item["pagination_links"]:
                            href = clean_url(href)
                            if same_domain_only and urlparse(href).netloc != start_domain:
                                continue
                            if href not in seen and url_allowed(href, include_patterns, exclude_patterns):
                                q.append((href, depth+1))
                    if delay > 0:
                        time.sleep(delay)
                    # Remove from futures
                    del futures[future]
                    # Stop if reached max_pages
                    if len(out_items) >= max_pages:
                        break
    finally:
        try:
            renderer.close()
        except Exception:
            pass

    return out_items

# -------- CLI --------

def parse_selectors(select_str: str) -> dict:
    out = {}
    if not select_str:
        return out
    parts = [p.strip() for p in select_str.split(",")]
    for p in parts:
        if not p or ":" not in p:
            continue
        key, css = p.split(":", 1)
        key = key.strip()
        css = css.strip()
        if key and css:
            out[key] = css
    return out

def load_config(path: str) -> dict:
    if not path:
        return {}
    with open(path, "r", encoding="utf-8") as f:
        cfg = yaml.safe_load(f) or {}
    return cfg

def load_site_profile(domain: str):
    """Load a YAML or JSON profile for a given domain from site_profiles/"""
    import os
    base = os.path.join(os.path.dirname(__file__), "site_profiles")
    for ext in ("yaml", "yml", "json"):
        path = os.path.join(base, f"{domain}.{ext}")
        if os.path.exists(path):
            with open(path, "r", encoding="utf-8") as f:
                if ext == "json":
                    return json.load(f)
                else:
                    return yaml.safe_load(f)
    return None

def write_xlsx(items, path):
    if openpyxl is None:
        print("openpyxl not installed, cannot write Excel file.", file=sys.stderr)
        return
    wb = openpyxl.Workbook()
    ws = wb.active
    ws.title = "autoscrape"
    # Use same fields as CSV
    fields = [
        "url","status","title","meta_description","readability_title",
        "n_links","n_images","n_tables","n_jsonld","n_emails","n_phones"
    ]
    ws.append(fields)
    for it in items:
        row = [flatten_for_csv(it).get(f) for f in fields]
        ws.append(row)
    wb.save(path)

def merge_dicts(a, b):
    """Merge two dicts recursively, b overrides a."""
    out = dict(a)
    for k, v in b.items():
        if k in out and isinstance(out[k], dict) and isinstance(v, dict):
            out[k] = merge_dicts(out[k], v)
        else:
            out[k] = v
    return out

def main():
    ap = argparse.ArgumentParser(description="autoscrape v2: crawler with JS rendering, caching, YAML config.")
    ap.add_argument("url", nargs="?", help="Start URL to crawl/scrape (overrides config.start_url if provided)")
    ap.add_argument("--config", help="Path to YAML config file")
    ap.add_argument("--max-pages", type=int, help="Override max pages")
    ap.add_argument("--max-depth", type=int, help="Override max depth")
    ap.add_argument("--same-domain-only", action="store_true", help="Restrict crawl to the same domain")
    ap.add_argument("--delay", type=float, help="Delay between requests in seconds")
    ap.add_argument("--ignore-robots", action="store_true", help="Ignore robots.txt")
    ap.add_argument("--select", type=str, default="", help='Custom CSS selectors, e.g. "price:.price, title:h1"')
    ap.add_argument("--use-js", action="store_true", help="Enable Playwright JS rendering for pages")
    ap.add_argument("--render-pattern", action="append", help="Regex pattern(s) of URLs to render with JS (may repeat)")
    ap.add_argument("--cache", action="store_true", help="Enable requests-cache with defaults")
    ap.add_argument("--cache-expire", type=int, help="Cache expire_after seconds")
    ap.add_argument("--out-jsonl", default="autoscrape.jsonl", help="Path to write JSON Lines")
    ap.add_argument("--out-csv", default="autoscrape.csv", help="Path to write CSV summary")
    ap.add_argument("--out-xlsx", default=None, help="Path to write Excel summary (optional)")
    args = ap.parse_args()

    cfg = load_config(args.config) if args.config else {}
    config = cfg if isinstance(cfg, dict) else {}

    # Auto-load site profile if available
    start_url = args.url or config.get("start_url")
    domain = None
    if start_url:
        domain = urlparse(start_url).netloc.lower()
        if domain.startswith("www."):
            domain = domain[4:]
    site_profile = load_site_profile(domain) if domain else None
    if site_profile:
        config = merge_dicts(config, site_profile)

    if args.max_pages is not None: config["max_pages"] = args.max_pages
    if args.max_depth is not None: config["max_depth"] = args.max_depth
    if args.same_domain_only: config["same_domain_only"] = True
    if args.delay is not None: config["delay"] = args.delay
    if args.ignore_robots: config["ignore_robots"] = True
    if args.select: 
        cli_selectors = parse_selectors(args.select)
        config["selectors"] = {**config.get("selectors", {}), **cli_selectors}
    render_cfg = config.get("render", {}) or {}
    if args.use_js: render_cfg["use_js"] = True
    if args.render_pattern:
        render_cfg["url_patterns"] = list(render_cfg.get("url_patterns", []) or []) + args.render_pattern
    config["render"] = render_cfg
    cache_cfg = config.get("cache", {}) or {}
    if args.cache: cache_cfg["enabled"] = True
    if args.cache_expire is not None: cache_cfg["expire_after"] = args.cache_expire
    config["cache"] = cache_cfg

    start_url = args.url or config.get("start_url")
    if not start_url:
        print("Error: provide a start URL (arg) or in config.start_url", file=sys.stderr)
        sys.exit(2)

    items = crawl(start_url=start_url, config=config)

    with open(args.out_jsonl, "w", encoding="utf-8") as f:
        for it in items:
            f.write(json.dumps(it, ensure_ascii=False) + "\n")

    # Flatten items: one row per quote (with author/tags), not per page
    # Find all custom fields
    custom_fields = set()
    for it in items:
        custom = it.get("custom", {})
        if isinstance(custom, dict):
            custom_fields.update(custom.keys())
    base_fields = [
        "url","status","title","meta_description","readability_title",
        "n_links","n_images","n_tables","n_jsonld","n_emails","n_phones"
    ]
    all_fields = base_fields + sorted(custom_fields)

    # If selectors are for quotes, author, tags, flatten so each row is a quote
    def explode_items(items):
        rows = []
        for it in items:
            custom = it.get("custom", {}) or {}
            # If all custom fields are lists of the same length, explode
            list_fields = {k: v for k, v in custom.items() if isinstance(v, list)}
            if list_fields and all(len(v) == len(next(iter(list_fields.values()))) for v in list_fields.values()):
                n = len(next(iter(list_fields.values())))
                for i in range(n):
                    row = {k: v[i] if isinstance(v, list) and len(v) > i else v for k, v in custom.items()}
                    # Add base fields
                    for bf in base_fields:
                        row[bf] = it.get(bf)
                    rows.append(row)
            else:
                # Fallback: one row per page
                row = {**custom}
                for bf in base_fields:
                    row[bf] = it.get(bf)
                rows.append(row)
        return rows

    flat_rows = explode_items(items)
    with open(args.out_csv, "w", encoding="utf-8", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=all_fields)
        writer.writeheader()
        for row in flat_rows:
            writer.writerow(row)

    if args.out_xlsx:
        write_xlsx(flat_rows, args.out_xlsx)
        print(f"Excel summary written to: {args.out_xlsx}")
    print(f"Scraped {len(items)} pages.")
    print(f"JSONL written to: {args.out_jsonl}")
    print(f"CSV summary written to: {args.out_csv}")

if __name__ == "__main__":
    main()
