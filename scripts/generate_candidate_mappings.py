"""Generate candidate GTIN -> CIP11 mappings from autoscrape/found_gtins.jsonl.

Heuristic: for GTIN strings of length >=11, use the first 11 digits as the CIP-like value.
Writes JSON and CSV candidate files under data/.
"""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
INPUT = ROOT / 'autoscrape' / 'found_gtins.jsonl'
OUT_JSON = ROOT / 'data' / 'gtin_ndc_crosswalk_candidates.json'
OUT_CSV = ROOT / 'data' / 'gtin_ndc_crosswalk_candidates.csv'

def main():
    if not INPUT.exists():
        print(f"Missing input: {INPUT}")
        return

    gtins = []
    with INPUT.open('r', encoding='utf-8') as fh:
        for line in fh:
            line = line.strip()
            if not line:
                continue
            try:
                rec = json.loads(line)
            except Exception:
                continue
            for g in rec.get('gtins', []) or []:
                if not g:
                    continue
                g = str(g).strip()
                gtins.append(g)

    # dedupe while preserving order
    seen = set()
    dedup = []
    for g in gtins:
        if g in seen:
            continue
        seen.add(g)
        dedup.append(g)

    mapping = {}
    for g in dedup:
        # only numeric-like values
        if not any(ch.isdigit() for ch in g):
            continue
        digits = ''.join(ch for ch in g if ch.isdigit())
        if len(digits) < 11:
            # skip too-short values
            continue
        cip11 = digits[:11]
        mapping[digits] = cip11

    # write JSON
    with OUT_JSON.open('w', encoding='utf-8') as fh:
        json.dump(mapping, fh, ensure_ascii=False, indent=2, sort_keys=True)

    # write CSV
    with OUT_CSV.open('w', encoding='utf-8') as fh:
        fh.write('gtin,cip11\n')
        for gt, cip in mapping.items():
            fh.write(f'{gt},{cip}\n')

    print(f'WROTE {OUT_JSON} entries={len(mapping)}')

if __name__ == '__main__':
    main()
