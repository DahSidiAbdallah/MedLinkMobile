import sys
import os
from autoscrape import crawl
import openpyxl

def test_xlsx_export():
    config = {
        "max_pages": 1,
        "max_depth": 0,
        "same_domain_only": True,
        "delay": 0.1,
        "ignore_robots": True,
        "selectors": {"title": "h1"},
        "render": {"use_js": False},
        "cache": {"enabled": False}
    }
    out_xlsx = "test_autoscrape_out.xlsx"
    if os.path.exists(out_xlsx):
        os.remove(out_xlsx)
    results = crawl("https://example.com", config)
    # Write xlsx using the new CLI logic
    from autoscrape import write_xlsx
    write_xlsx(results, out_xlsx)
    assert os.path.exists(out_xlsx), "Excel file not created!"
    wb = openpyxl.load_workbook(out_xlsx)
    ws = wb.active
    assert ws.max_row > 1, "Excel file missing data!"
    print("Excel export test passed.")
    os.remove(out_xlsx)

if __name__ == "__main__":
    test_xlsx_export()
