
from flask import Flask, request, jsonify
import subprocess
import sys
import os
import json
import re
import yaml

app = Flask(__name__)

# Path to your autoscrape.py script
AUTOSCRAPE_PATH = os.path.join(os.path.dirname(__file__), 'autoscrape.py')
SITE_PROFILES_DIR = os.path.join(os.path.dirname(__file__), 'site_profiles')

def detect_code_type(code):
    """Detect if code is NDC, GTIN, or other."""
    code = code.strip()
    if re.fullmatch(r'\d{10}', code):
        return 'NDC-10'
    if re.fullmatch(r'\d{11}', code):
        return 'NDC-11'
    if re.fullmatch(r'\d{14}', code):
        return 'GTIN-14'
    if re.fullmatch(r'\d{13}', code):
        return 'GTIN-13'
    if re.fullmatch(r'\d{12}', code):
        return 'GTIN-12'
    if re.fullmatch(r'\d{8}', code):
        return 'GTIN-8'
    return 'UNKNOWN'

def get_profile_for_country(country):
    """Return the path to a YAML profile for a given country if available."""
    for ext in ("yaml", "yml"):
        path = os.path.join(SITE_PROFILES_DIR, f"{country.lower()}.{ext}")
        if os.path.exists(path):
            return path
    return None


def build_urls_for_code(code, code_type):
    """Return a prioritized list of URLs to try for this code."""
    urls = []
    if code_type.startswith('NDC'):
        # US: DailyMed, openFDA
        urls.append(f"https://dailymed.nlm.nih.gov/dailymed/search.cfm?query={code}")
        urls.append(f"https://www.accessdata.fda.gov/scripts/cder/daf/index.cfm?event=overview.process&ApplNo={code}")
    if code_type.startswith('GTIN') or code_type.startswith('NDC'):
        # EMA (Europe)
        urls.append(f"https://www.ema.europa.eu/en/medicines/search_api_aggregation?search_api_fulltext={code}")
        # NAFDAC (Nigeria)
        urls.append(f"https://www.nafdac.gov.ng/?s={code}")
        # PPB (Kenya)
        urls.append(f"https://www.pharmacyboardkenya.org/?s={code}")
        # SAHPRA (South Africa)
        urls.append(f"https://www.sahpra.org.za/?s={code}")
    # Fallback: Google search
    urls.append(f"https://www.google.com/search?q=drug+{code}")
    return urls

def extract_standard_fields(scraped):
    """Try to extract standard drug info fields from autoscrape output."""
    # Try common locations for fields
    def get_first(*keys):
        for k in keys:
            v = scraped.get(k)
            if v:
                return v
        return None
    # Try meta, headings, custom, ai_autodetect, smart, readability, etc.
    meta = scraped.get('meta', {})
    custom = scraped.get('custom', {})
    ai = scraped.get('ai_autodetect', {})
    smart = scraped.get('smart', {})
    readability = scraped.get('readability', {})
    # Heuristic extraction
    return {
        'title': get_first('title', 'drug_name', 'name', 'brand_name', 'generic_name', 'product_name', 'title', meta.get('title'), custom.get('title'), ai.get('title'), smart.get('title'), readability.get('readability_title')),
        'indications': get_first('indications', 'indications_and_usage', custom.get('indications'), ai.get('indications'), smart.get('indications'), readability.get('readability_text')),
        'dosage': get_first('dosage', 'dosage_and_administration', custom.get('dosage'), ai.get('dosage'), smart.get('dosage')),
        'side_effects': get_first('side_effects', 'adverse_reactions', custom.get('side_effects'), ai.get('side_effects'), smart.get('side_effects')),
        'expiry': get_first('expiry', 'expiration', custom.get('expiry'), ai.get('expiry'), smart.get('expiry')),
        'raw': scraped
    }

@app.route('/scrape')
def scrape():
    code = request.args.get('code')
    if not code:
        return jsonify({'error': 'Missing code parameter'}), 400


    code_type = detect_code_type(code)
    urls = build_urls_for_code(code, code_type)
    # Try each URL in order, return first with usable info
    for url in urls:
        # Compose autoscrape.py command
        cmd = [sys.executable, AUTOSCRAPE_PATH, url, '--max-pages', '1', '--out-jsonl', 'result.jsonl', '--out-csv', 'result.csv']
        try:
            result = subprocess.run(cmd, capture_output=True, text=True, timeout=40)
            # Read the first result from result.jsonl
            if os.path.exists('result.jsonl'):
                with open('result.jsonl', 'r', encoding='utf-8') as f:
                    line = f.readline()
                    if line:
                        scraped = json.loads(line)
                        fields = extract_standard_fields(scraped)
                        # If at least one key field is present, return it
                        if any([fields.get('title'), fields.get('indications'), fields.get('dosage'), fields.get('side_effects')]):
                            return jsonify(fields)
        except Exception as e:
            continue
    # If none yielded usable info, return last raw result or error
    return jsonify({'error': 'No usable drug info found for code', 'code': code, 'code_type': code_type, 'tried_urls': urls}), 404

if __name__ == '__main__':
    # Disable debug mode to avoid Python 3.13 threading issues
    app.run(host='0.0.0.0', port=5001, debug=False)
