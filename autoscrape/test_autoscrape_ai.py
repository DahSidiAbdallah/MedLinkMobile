import sys
import os
from autoscrape import crawl

def test_ai_autodetect():
    config = {
        "max_pages": 1,
        "max_depth": 0,
        "same_domain_only": True,
        "delay": 0.1,
        "ignore_robots": True,
        "ai_autodetect": True,
        "render": {"use_js": False},
        "cache": {"enabled": False}
    }
    # Use a product/category page for best results
    results = crawl("https://www.avito.ma/fr/maroc/voitures_d_occasion-%C3%A0_vendre", config)
    assert isinstance(results, list)
    assert len(results) > 0
    ai = results[0].get("ai_autodetect")
    assert ai is not None, "AI autodetect missing!"
    assert "cards" in ai, "No cards extracted by AI autodetect!"
    print("AI autodetect test passed.")

if __name__ == "__main__":
    test_ai_autodetect()
