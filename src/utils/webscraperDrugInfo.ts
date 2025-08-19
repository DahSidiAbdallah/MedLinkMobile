import { Platform } from 'react-native';

export interface ScraperDrugInfo {
  [key: string]: any;
}

/**
 * Calls the local Python webscraper (autoscrape.py) to fetch drug info for a given code (NDC, GTIN, etc).
 * Returns the parsed JSON result or null if not available.
 *
 * On development, this assumes a local server is running that wraps autoscrape.py (e.g., Flask or FastAPI on http://localhost:5001).
 * In production, this should point to a deployed API endpoint.
 */
export async function fetchDrugInfoFromScraper(code: string): Promise<ScraperDrugInfo | null> {
  // For demo: assumes a local Flask/FastAPI server at http://localhost:5001/scrape?code=...
  // You must run a server that wraps autoscrape.py and exposes this endpoint.
  const baseUrl = Platform.OS === 'web' ? '/api/scrape' : 'http://localhost:5001/scrape';
  const url = `${baseUrl}?code=${encodeURIComponent(code)}`;
  try {
    const resp = await fetch(url);
    if (!resp.ok) return null;
    const data = await resp.json();
    return data;
  } catch (e) {
    console.warn('Webscraper request failed:', e);
    return null;
  }
}
