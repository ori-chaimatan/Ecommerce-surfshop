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

interface StrapiRequestOptions {
  /** Prefix for log lines, e.g. "cart". */
  label: string;
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  /** Sent as JSON. */
  body?: unknown;
  headers?: Record<string, string>;
  /** Non-2xx statuses that are expected and shouldn't be logged (e.g. 409 for a sold-out size). */
  silentStatuses?: number[];
}

export interface StrapiResponse {
  ok: boolean;
  /** 0 when the request never got a response. */
  status: number;
  /** The parsed body, or null when it wasn't JSON. */
  data: unknown;
}

/**
 * Uncached request against the Strapi REST API, for per-shopper data and writes (the cart).
 * Never throws: a network failure is `{ ok: false, status: 0 }`. Error bodies are returned
 * so callers can read Strapi's error code.
 */
export async function strapiRequest(
  path: string,
  { label, method = 'GET', body, headers = {}, silentStatuses = [] }: StrapiRequestOptions
): Promise<StrapiResponse> {
  let response: Response;
  try {
    response = await fetch(`${STRAPI_URL}/api/${path}`, {
      method,
      headers: body === undefined ? headers : { 'Content-Type': 'application/json', ...headers },
      body: body === undefined ? undefined : JSON.stringify(body),
      cache: 'no-store',
    });
  } catch (error) {
    console.error(`[${label}] request failed`, error);
    return { ok: false, status: 0, data: null };
  }

  if (!response.ok && !silentStatuses.includes(response.status)) {
    console.error(`[${label}] Strapi responded ${response.status}`);
  }

  const data = await response.json().catch(() => null);
  return { ok: response.ok, status: response.status, data };
}
