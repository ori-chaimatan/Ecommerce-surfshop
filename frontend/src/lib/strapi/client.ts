export const STRAPI_URL = process.env.STRAPI_URL ?? 'http://localhost:1337';

interface StrapiFetchOptions<T> {
  /** Prefix for log lines, e.g. "navigation". */
  label: string;
  /** Returned on a network error, a non-2xx response or an unparsable body. */
  fallback: T;
  /** Seconds before Next revalidates the cached response. */
  revalidate?: number;
  /** Non-2xx statuses that are expected and shouldn't be logged (e.g. 404 for an empty single type). */
  silentStatuses?: number[];
}

/**
 * Server-side GET against the Strapi REST API (`/api/<path>`). Never throws:
 * failures are logged and resolve to `fallback`, so a page never breaks
 * because Strapi is down. The body is returned unvalidated — callers check its shape.
 */
export async function strapiFetch<T>(
  path: string,
  { label, fallback, revalidate = 60, silentStatuses = [] }: StrapiFetchOptions<T>
): Promise<unknown> {
  try {
    const response = await fetch(`${STRAPI_URL}/api/${path}`, { next: { revalidate } });

    if (!response.ok) {
      if (!silentStatuses.includes(response.status)) {
        console.error(`[${label}] Strapi responded ${response.status}`);
      }
      return fallback;
    }

    return await response.json();
  } catch (error) {
    console.error(`[${label}] request failed`, error);
    return fallback;
  }
}
