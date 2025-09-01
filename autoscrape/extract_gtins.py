import json, re
p = 'autoscrape_moncoinsante.jsonl'
found = set()
with open(p, encoding='utf-8') as fh:
    for line in fh:
        line = line.strip()
        if not line:
            continue
        try:
            obj = json.loads(line)
        except Exception:
            continue
        for ld in obj.get('json_ld', []):
            if not isinstance(ld, dict):
                continue
            t = ld.get('@type')
            isprod = False
            if isinstance(t, list):
                isprod = 'Product' in t
            else:
                isprod = (t == 'Product')
            if isprod:
                for k in ('gtin13', 'gtin12', 'gtin8', 'sku', 'mpn'):
                    v = ld.get(k)
                    if isinstance(v, str) and v.isdigit():
                        found.add(v)
# fallback: regex across file for common patterns
text = open(p, encoding='utf-8').read()
for key in ('gtin13','sku','mpn'):
    for m in re.findall(r'"' + key + r'"\s*:\s*"(\d{8,14})"', text):
        found.add(m)
# print sorted
for v in sorted(found):
    print(v)
print('TOTAL', len(found))
