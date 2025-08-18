@echo off
REM Batch script to automate scraping and post-processing for all regulators

REM EMA
python autoscrape.py --config autoscrape\site_profiles\ema.yaml --out-jsonl ema_autoscrape.jsonl
python postprocess_recalls.py ema_autoscrape.jsonl ..\MedLinkMobile\src\data\ema_recalls.json EMA

REM SAHPRA
python autoscrape.py --config autoscrape\site_profiles\sahpra.yaml --out-jsonl sahpra_autoscrape.jsonl
python postprocess_recalls.py sahpra_autoscrape.jsonl ..\MedLinkMobile\src\data\sahpra_recalls.json SAHPRA

REM NAFDAC
python autoscrape.py --config autoscrape\site_profiles\nafdac.yaml --out-jsonl nafdac_autoscrape.jsonl
python postprocess_recalls.py nafdac_autoscrape.jsonl ..\MedLinkMobile\src\data\nafdac_recalls.json NAFDAC

REM PPB
python autoscrape.py --config autoscrape\site_profiles\ppb.yaml --out-jsonl ppb_autoscrape.jsonl
python postprocess_recalls.py ppb_autoscrape.jsonl ..\MedLinkMobile\src\data\ppb_recalls.json PPB

echo All recall files updated.
