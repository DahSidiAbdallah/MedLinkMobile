import sys
import os
from autoscrape import crawl

def test_extruct_trafilatura():
    config = {
        "max_pages": 1,
        "max_depth": 0,
        "same_domain_only": True,
        "delay": 0.1,
        "ignore_robots": True,
        "ai_autodetect": True,
        "ai_export_raw_html": False,
        "render": {"use_js": False},
        "cache": {"enabled": False}
    }
    # Use a news/blog page for best results
    results = crawl("https://www.bbc.com/news", config)
    assert isinstance(results, list)
    assert len(results) > 0
    ai = results[0].get("ai_autodetect")
    assert ai is not None, "AI autodetect missing!"
    assert "extruct" in ai, "Extruct extraction missing!"
    assert "trafilatura" in ai, "Trafilatura extraction missing!"
    print("Extruct and Trafilatura extraction test passed.")

if __name__ == "__main__":
    test_extruct_trafilatura()
