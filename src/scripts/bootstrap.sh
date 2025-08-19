#!/usr/bin/env bash
set -euo pipefail

echo "== Node setup =="
# if you use npm:
npm ci || npm install

# if you use yarn:
# corepack enable
# yarn install --immutable

echo "== Python venv =="
python3 -m venv .venv
source .venv/bin/activate

python -m pip install --upgrade pip
# Scraper deps — adjust if your autoscrape.py uses different libraries
pip install -r autoscrape/requirements.txt

echo "== OK =="
