import sys
import os
from autoscrape import crawl

def test_wait_config():
    config = {
        "max_pages": 1,
        "max_depth": 0,
        "same_domain_only": True,
        "delay": 0.1,
        "ignore_robots": True,
        "selectors": {"title": "h1"},
        "render": {"use_js": False},
        "wait": {
            "wait_time": 1  # Should wait at least 1 second per page
        },
        "cache": {"enabled": False}
    }
    import time
    start = time.time()
    results = crawl("https://example.com", config)
    elapsed = time.time() - start
    assert elapsed >= 1, f"Wait time not respected: elapsed={elapsed}"
    assert isinstance(results, list)
    print("Wait config test passed.")

if __name__ == "__main__":
    test_wait_config()
