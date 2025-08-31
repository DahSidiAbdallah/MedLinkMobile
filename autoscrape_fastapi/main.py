from fastapi import FastAPI, Query
from fastapi.responses import JSONResponse
import requests
import re

app = FastAPI()
OPENFDA = 'https://api.fda.gov'


def detect_code_type(code: str) -> str:
    s = code.strip()
    if re.fullmatch(r'\d{10}', s):
        return 'NDC-10'
    if re.fullmatch(r'\d{11}', s):
        return 'NDC-11'
    if re.fullmatch(r'\d{14}', s):
        return 'GTIN-14'
    return 'UNKNOWN'


@app.get('/scrape')
def scrape(code: str = Query(..., min_length=1)):
    if not code:
        return JSONResponse({'error': 'missing code'}, status_code=400)
    code_type = detect_code_type(code)
    try:
        # For NDC-like codes, prefer NDC endpoint
        if code_type.startswith('NDC'):
            # Try ndc.json first
            url = f"{OPENFDA}/drug/ndc.json?search=product_ndc:{code}"
            r = requests.get(url, timeout=8)
            if r.status_code == 200 and r.json().get('results'):
                return r.json().get('results')[0]
            # fallback label
            url2 = f"{OPENFDA}/drug/label.json?search=openfda.product_ndc:{code}&limit=1"
            r2 = requests.get(url2, timeout=8)
            if r2.status_code == 200 and r2.json().get('results'):
                return r2.json().get('results')[0]
            # fallback enforcement
            url3 = f"{OPENFDA}/drug/enforcement.json?search=openfda.product_ndc:{code}&limit=1"
            r3 = requests.get(url3, timeout=8)
            if r3.status_code == 200 and r3.json().get('results'):
                return r3.json().get('results')[0]
        else:
            # For other codes, try a generic label search
            url = f"{OPENFDA}/drug/label.json?search={code}&limit=1"
            r = requests.get(url, timeout=8)
            if r.status_code == 200 and r.json().get('results'):
                return r.json().get('results')[0]
    except Exception as e:
        return JSONResponse({'error': 'upstream request failed', 'detail': str(e)}, status_code=502)

    return JSONResponse({'error': 'No data found for code', 'code': code, 'code_type': code_type}, status_code=404)
