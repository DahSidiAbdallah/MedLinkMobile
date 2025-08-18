import json
import sys
import os

def process_jsonl(input_path, output_path, source):
    recalls = []
    with open(input_path, 'r', encoding='utf-8') as f:
        for line in f:
            if not line.strip():
                continue
            item = json.loads(line)
            custom = item.get('custom', {})
            recalls.append({
                'id': (custom.get('id') or [item.get('id','')])[0] if isinstance(custom.get('id'), list) else custom.get('id', ''),
                'product': (custom.get('product') or [item.get('product','')])[0] if isinstance(custom.get('product'), list) else custom.get('product', ''),
                'gtin': (custom.get('gtin') or [item.get('gtin', None)])[0] if isinstance(custom.get('gtin'), list) else custom.get('gtin', None),
                'ndc': (custom.get('ndc') or [item.get('ndc', None)])[0] if isinstance(custom.get('ndc'), list) else custom.get('ndc', None),
                'reason': (custom.get('reason') or [item.get('reason','')])[0] if isinstance(custom.get('reason'), list) else custom.get('reason', ''),
                'date': (custom.get('date') or [item.get('date','')])[0] if isinstance(custom.get('date'), list) else custom.get('date', ''),
                'source': source
            })
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(recalls, f, ensure_ascii=False, indent=2)

if __name__ == "__main__":
    if len(sys.argv) != 4:
        print("Usage: python postprocess_recalls.py <input_jsonl> <output_json> <source>")
        sys.exit(1)
    process_jsonl(sys.argv[1], sys.argv[2], sys.argv[3])
