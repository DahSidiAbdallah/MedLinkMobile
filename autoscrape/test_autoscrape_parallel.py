import sys
import os
import tempfile
import yaml
import json
from autoscrape import crawl

def test_parallel_crawl():
    # Use a simple site for test, e.g. example.com
    config = {
        "max_pages": 2,
        "max_depth": 1,
        "same_domain_only": True,
        "delay": 0.1,
        "ignore_robots": True,
        "selectors": {"title": "h1"},
        "render": {"use_js": False},
        "cache": {"enabled": False}
    }
    results = crawl("https://example.com", config)
    assert isinstance(results, list)
    assert len(results) > 0
    assert any("title" in (item.get("custom") or {}) for item in results)
    print("Parallel crawl test passed.")

if __name__ == "__main__":
    test_parallel_crawl()
