import json, re
infile = 'autoscrape_moncoinsante.jsonl'
outfile = 'product_urls.txt'
urls = set()
with open(infile, encoding='utf-8') as fh:
    for line in fh:
        try:
            obj = json.loads(line)
        except Exception:
            continue
        # look for links in 'links' field
        links = obj.get('links', {}).get('links', [])
        for l in links:
            href = l.get('href') if isinstance(l, dict) else None
            if href and href.startswith('https://moncoinsante.com/mcs/en/') and href.endswith('.html'):
                urls.add(href)
        # also check json_ld ItemList entries
        for ld in obj.get('json_ld', []):
            try:
                if ld.get('@type') == 'ItemList':
                    for item in ld.get('itemListElement', []):
                        u = item.get('url') if isinstance(item, dict) else None
                        if u and u.startswith('https://moncoinsante.com/mcs/en/') and u.endswith('.html'):
                            urls.add(u)
            except Exception:
                pass
# write
with open(outfile, 'w', encoding='utf-8') as out:
    for u in sorted(urls):
        out.write(u + '\n')
print('WROTE', outfile, 'COUNT', len(urls))
if len(urls) > 0:
    print('SAMPLE', list(sorted(urls))[:10])
