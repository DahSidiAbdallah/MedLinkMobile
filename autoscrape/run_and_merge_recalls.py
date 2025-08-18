import subprocess
import os
import json

# List of regulators and their configs
REGULATORS = [
    {"name": "EMA", "config": "site_profiles/ema.yaml", "jsonl": "ema_autoscrape.jsonl", "output": "..\\MedLinkMobile\\src\\data\\ema_recalls.json"},
    {"name": "SAHPRA", "config": "site_profiles/sahpra.yaml", "jsonl": "sahpra_autoscrape.jsonl", "output": "..\\MedLinkMobile\\src\\data\\sahpra_recalls.json"},
    {"name": "NAFDAC", "config": "site_profiles/nafdac.yaml", "jsonl": "nafdac_autoscrape.jsonl", "output": "..\\MedLinkMobile\\src\\data\\nafdac_recalls.json"},
    {"name": "PPB", "config": "site_profiles/ppb.yaml", "jsonl": "ppb_autoscrape.jsonl", "output": "..\\MedLinkMobile\\src\\data\\ppb_recalls.json"},
]

POSTPROCESS = "postprocess_recalls.py"
AUTOSCRAPE = "autoscrape.py"


def run_scrape_and_postprocess():
    for reg in REGULATORS:
        print(f"Scraping {reg['name']}...")
        subprocess.run(["python", AUTOSCRAPE, "--config", reg["config"], "--out-jsonl", reg["jsonl"]], check=True)
        print(f"Normalizing {reg['name']} output...")
        subprocess.run(["python", POSTPROCESS, reg["jsonl"], reg["output"], reg["name"]], check=True)
        print(f"Done: {reg['output']}")

    # Optionally, merge all into one file
    merged = []
    for reg in REGULATORS:
        with open(reg["output"], "r", encoding="utf-8") as f:
            merged.extend(json.load(f))
    merged_path = os.path.join("..", "MedLinkMobile", "src", "data", "all_recalls.json")
    with open(merged_path, "w", encoding="utf-8") as f:
        json.dump(merged, f, ensure_ascii=False, indent=2)
    print(f"All recalls merged to {merged_path}")

if __name__ == "__main__":
    run_scrape_and_postprocess()
