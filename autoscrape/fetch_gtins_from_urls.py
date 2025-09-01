import json, re, time, sys
from urllib.parse import urlparse
import requests

IN='product_urls.txt'
OUT='found_gtins.jsonl'
MAX=200

with open(IN, encoding='utf-8') as f:
    urls = [l.strip() for l in f if l.strip()]
urls = urls[:MAX]

session = requests.Session()
session.headers.update({'User-Agent':'autoscrape-bot/1.0 (contact: dev)'})

ld_re = re.compile(r'<script[^>]+type="application/ld\+json"[^>]*>(.*?)</script>', re.S|re.I)

def extract_ld(html):
    out = []
    for m in ld_re.findall(html):
        s = m.strip()
        try:
            # sometimes multiple json objects concatenated; try to load directly
            data = json.loads(s)
            out.append(data)
        except Exception:
            # try to find objects inside
            for chunk in re.findall(r'\{.*?\}', s, re.S):
                try:
                    data = json.loads(chunk)
                    out.append(data)
                except Exception:
                    continue
    return out

found_total = 0
seen = set()
with open(OUT, 'w', encoding='utf-8') as out:
    for i, url in enumerate(urls, 1):
        try:
            r = session.get(url, timeout=15)
            html = r.text
            lds = extract_ld(html)
            gtins = set()
            for ld in lds:
                if not isinstance(ld, dict):
                    continue
                t = ld.get('@type')
                if isinstance(t, list):
                    isprod = 'Product' in t
                else:
                    isprod = (t == 'Product')
                if isprod:
                    for k in ('gtin13','gtin12','gtin8','sku','mpn'):
                        v = ld.get(k)
                        if isinstance(v, str) and v.isdigit():
                            gtins.add(v)
            # fallback: regex for GTIN-like numbers in page
            for m in re.findall(r'\b(\d{8,14})\b', html):
                if m.isdigit():
                    # simple heuristic: many product urls include GTIN at end
                    if url.endswith(m + '.html'):
                        gtins.add(m)
            rec = {'url':url, 'gtins': sorted(gtins)}
            if gtins:
                found_total += len(gtins)
                for g in gtins:
                    seen.add(g)
            out.write(json.dumps(rec, ensure_ascii=False) + '\n')
            print(f'[{i}/{len(urls)}] {len(gtins)} gtins - {url}')
        except Exception as e:
            print(f'[{i}/{len(urls)}] ERROR {e} - {url}')
        time.sleep(0.5)

print('WROTE', OUT, 'total_gtin_values_found=', len(seen))
