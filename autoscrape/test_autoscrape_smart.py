import sys
import os
from autoscrape import crawl

def test_smart_extract():
    config = {
        "max_pages": 1,
        "max_depth": 0,
        "same_domain_only": True,
        "delay": 0.1,
        "ignore_robots": True,
        "smart": True,
        "render": {"use_js": False},
        "cache": {"enabled": False}
    }
    results = crawl("https://example.com", config)
    assert isinstance(results, list)
    assert len(results) > 0
    smart = results[0].get("smart")
    assert smart is not None, "Smart extraction missing!"
    assert "main_text" in smart or "tables" in smart or "lists" in smart, "No smart content extracted!"
    print("Smart extraction test passed.")

if __name__ == "__main__":
    test_smart_extract()
