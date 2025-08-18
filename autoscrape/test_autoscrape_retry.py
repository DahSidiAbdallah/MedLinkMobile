import sys
import os
from autoscrape import crawl

def test_retry():
    # Use an invalid URL to force retries and error logging
    config = {
        "max_pages": 1,
        "max_depth": 0,
        "same_domain_only": True,
        "delay": 0.1,
        "ignore_robots": True,
        "selectors": {"title": "h1"},
        "render": {"use_js": False},
        "retry": {"retries": 2, "retry_delay": 0.5},
        "cache": {"enabled": False}
    }
    import io
    import contextlib
    # Capture stderr
    fake_stderr = io.StringIO()
    with contextlib.redirect_stderr(fake_stderr):
        results = crawl("http://nonexistent.example.invalid", config)
    err = fake_stderr.getvalue()
    assert "Fetch failed" in err, "Error logging not found in stderr!"
    assert isinstance(results, list)
    print("Retry and error logging test passed.")

if __name__ == "__main__":
    test_retry()
