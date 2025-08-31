import { Platform } from 'react-native';
import { fetchWithRetries } from './network';

export interface ScraperDrugInfo {
	[key: string]: any;
}

const DEFAULT_SCRAPER_DEV_HOST = 'http://localhost:5001';

// Common emulator hosts to try first when the app is running on an emulator.
const EMULATOR_HOSTS = [
	'http://10.0.2.2:5001', // Android emulator (Android Studio)
	'http://10.0.3.2:5001', // Genymotion
];

let cachedScraperBase: string | null = null;

async function probeUrl(base: string, timeoutMs = 1000): Promise<boolean> {
	try {
		// Use the existing retry wrapper with a short timeout to probe reachability.
		const probe = `${base.replace(/\/$/, '')}/scrape?code=__ping__`;
		const resp = await fetchWithRetries(probe, undefined, { retries: 0, timeoutMs });
		return resp?.ok === true;
	} catch {
		// Probe failed or timed out; treat as unreachable.
		return false;
	}
}

/**
 * Resolve the best scraper base URL for the current runtime.
 * Order: explicit global override -> emulator addresses (fast probe) -> localhost.
 * Caches the result to avoid repeated network probes.
 */
async function getScraperBaseUrl(): Promise<string> {
	if (cachedScraperBase) return cachedScraperBase;

	const override = (global as any).SCRAPER_BASE_URL;
	if (override && typeof override === 'string') {
		cachedScraperBase = override.replace(/\/$/, '');
		return cachedScraperBase;
	}

	// On web, use the relative API path (assumes a proxy or server plays the role).
	if (Platform.OS === 'web') {
		cachedScraperBase = '';
		return cachedScraperBase;
	}

	// Try emulator hosts first (fast probe). If one responds, use it.
	for (const candidate of EMULATOR_HOSTS) {
		// probe quickly; don't await long
		// eslint-disable-next-line no-await-in-loop
		if (await probeUrl(candidate, 800)) {
			cachedScraperBase = candidate;
			return cachedScraperBase;
		}
	}

	// Fallback to localhost
	cachedScraperBase = DEFAULT_SCRAPER_DEV_HOST;
	return cachedScraperBase;
}

export async function fetchDrugInfoFromScraper(code: string): Promise<ScraperDrugInfo | null> {
	try {
		const resolvedBase = await getScraperBaseUrl();
		const baseUrl = Platform.OS === 'web' ? '/api/scrape' : `${resolvedBase.replace(/\/$/, '')}/scrape`;
		const url = `${baseUrl}?code=${encodeURIComponent(code)}`;
		const resp = await fetchWithRetries(url, undefined, { retries: 2, timeoutMs: 10000 });
		if (resp?.ok !== true) return null;
		const data = await resp.json();
		return data;
	} catch (e) {
		console.warn('Webscraper request failed:', e);
		return null;
	}
}

