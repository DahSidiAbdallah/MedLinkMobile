import sys
import os
from autoscrape import crawl

def test_site_profile():
    config = {
        "max_pages": 1,
        "max_depth": 0,
        "same_domain_only": True,
        "delay": 0.1,
        "ignore_robots": True,
        "render": {"use_js": False},
        "cache": {"enabled": False}
    }
    # Should auto-load avito.ma.yaml profile
    results = crawl("https://avito.ma", config)
    assert isinstance(results, list)
    assert len(results) > 0
    custom = results[0].get("custom")
    assert custom is not None, "Profile selectors not applied!"
    assert "title" in custom, "Profile selector 'title' missing!"
    print("Site profile test passed.")

if __name__ == "__main__":
    test_site_profile()
