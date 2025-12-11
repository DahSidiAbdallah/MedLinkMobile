export type FetchOptions = {
  retries?: number;
  retryDelayMs?: number;
  timeoutMs?: number;
  headers?: Record<string, string>;
};

function delay(ms: number): Promise<void> {
  return new Promise((res) => setTimeout(res, ms));
}

/**
 * Robust fetch wrapper with timeout, retries and header merging.
 * - retries: number of retry attempts (default 2)
 * - retryDelayMs: base delay between retries (default 700ms)
 * - timeoutMs: per-request abort timeout (default 8000ms)
 */
export async function fetchWithRetries(
  url: string,
  opts?: RequestInit,
  fopts?: FetchOptions
): Promise<Response> {
  const retries = fopts?.retries ?? 2;
  const retryDelay = fopts?.retryDelayMs ?? 700;
  const timeoutMs = fopts?.timeoutMs ?? 8000;
  const extraHeaders = fopts?.headers ?? {};

  let lastErr: any = null;

  for (let attempt = 0; attempt <= retries; attempt++) {
    const controller = new AbortController();
    const signal = controller.signal;
    try {
      const mergedOpts: RequestInit = { ...(opts || {}), signal };
      const baseHeaders = (mergedOpts.headers as Record<string, string>) || {};
      mergedOpts.headers = { ...baseHeaders, ...extraHeaders };

      const timeout = setTimeout(() => controller.abort(), timeoutMs);
      const resp = await fetch(url, mergedOpts);
      clearTimeout(timeout);

      if (resp.ok) return resp;

      lastErr = new Error(`HTTP ${resp.status}`);
      // For client errors (other than 429) do not retry
      if (resp.status >= 400 && resp.status < 500 && resp.status !== 429) {
        throw lastErr;
      }

      // otherwise it's retriable (5xx or 429) and will fallthrough to retry
    } catch (e: unknown) {
      // Normalize AbortError -> timeout
      if ((e as any)?.name === 'AbortError') lastErr = new Error('timeout');
      else lastErr = e;

      if (attempt < retries) {
        await delay(retryDelay * (attempt + 1));
        continue;
      }

      throw lastErr;
    }
  }

  throw lastErr;
}

