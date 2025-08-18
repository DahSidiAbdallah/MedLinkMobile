import sys
import os
from autoscrape import crawl

def test_ai_autodetect_general():
    config = {
        "max_pages": 1,
        "max_depth": 0,
        "same_domain_only": True,
        "delay": 0.1,
        "ignore_robots": True,
        "ai_autodetect": True,
        "ai_export_raw_html": True,
        "render": {"use_js": False},
        "cache": {"enabled": False}
    }
    # Test on a news site (should extract headlines, dates, etc.)
    results = crawl("https://www.bbc.com/news", config)
    assert isinstance(results, list)
    assert len(results) > 0
    ai = results[0].get("ai_autodetect")
    assert ai is not None, "AI autodetect missing!"
    assert "cards" in ai, "No cards extracted by AI autodetect!"
    assert "raw_html" in ai, "Raw HTML not exported!"
    print("AI autodetect general test passed.")

if __name__ == "__main__":
    test_ai_autodetect_general()
