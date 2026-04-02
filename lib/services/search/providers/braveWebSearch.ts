import type {
  NormalizedSearchResult,
  SearchProvider
} from '@/lib/services/search/types';
import { SearchUserError } from '@/lib/services/search/searchUserError';

export type BraveSearchConfig = {
  apiKey: string;
  baseUrl: string;
};

const FETCH_TIMEOUT_MS = 20_000;

/**
 * Low-level Brave HTTP + JSON parsing. Never logs secrets or response bodies.
 */
export function createBraveSearchProvider(config: BraveSearchConfig): SearchProvider {
  return {
    id: 'brave-web',

    async search(query: string): Promise<NormalizedSearchResult[]> {
      const url = new URL(config.baseUrl);
      url.searchParams.set('q', query.trim() || 'news');
      url.searchParams.set('count', '10');

      let response: Response;
      try {
        response = await fetch(url.toString(), {
          method: 'GET',
          headers: {
            Accept: 'application/json',
            'X-Subscription-Token': config.apiKey
          },
          signal: AbortSignal.timeout(FETCH_TIMEOUT_MS)
        });
      } catch (e) {
        if (isAbortOrTimeout(e)) {
          throw new SearchUserError(
            'The search request timed out. Try again in a moment.',
            'timeout'
          );
        }
        throw new SearchUserError(
          'Could not reach the search service. Check your internet connection.',
          'network'
        );
      }

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          throw new SearchUserError(
            'Search could not be authorized. Check that your API key is valid in server settings.',
            'auth'
          );
        }
        if (response.status === 429) {
          throw new SearchUserError(
            'The search service is busy. Please try again in a few minutes.',
            'http'
          );
        }
        throw new SearchUserError(
          'The search service returned an error. Try again later.',
          'http'
        );
      }

      let data: unknown;
      try {
        data = await response.json();
      } catch {
        throw new SearchUserError(
          'The search service sent data we could not read. Try again later.',
          'parse'
        );
      }

      return normalizeBraveResults(data);
    }
  };
}

function isAbortOrTimeout(e: unknown): boolean {
  if (e instanceof DOMException && (e.name === 'AbortError' || e.name === 'TimeoutError')) {
    return true;
  }
  return false;
}

/**
 * Accept unknown JSON and return only well-formed hits (skip malformed rows).
 */
export function normalizeBraveResults(data: unknown): NormalizedSearchResult[] {
  if (data === null || typeof data !== 'object' || Array.isArray(data)) {
    return [];
  }

  const root = data as Record<string, unknown>;
  const web = root.web;

  if (web !== undefined && (typeof web !== 'object' || web === null || Array.isArray(web))) {
    return [];
  }

  const webObj = web as Record<string, unknown> | undefined;
  const raw = webObj?.results;

  if (!Array.isArray(raw)) {
    return [];
  }

  const hits: NormalizedSearchResult[] = [];
  for (const item of raw) {
    if (item === null || typeof item !== 'object' || Array.isArray(item)) continue;
    const r = item as Record<string, unknown>;

    const title = typeof r.title === 'string' ? r.title.trim() : '';
    const link = typeof r.url === 'string' ? r.url.trim() : '';
    const description =
      typeof r.description === 'string' ? r.description.trim() : '';
    if (!title || !link) continue;

    let age: string | undefined;
    if (typeof r.age === 'string') age = r.age.trim() || undefined;

    let hostname: string | undefined;
    const meta = r.meta_url;
    if (meta !== null && typeof meta === 'object' && !Array.isArray(meta)) {
      const h = (meta as { hostname?: unknown }).hostname;
      if (typeof h === 'string' && h.trim()) hostname = h.trim();
    }
    if (!hostname) hostname = safeHost(link);

    hits.push({
      title,
      url: link,
      description: description || title,
      age,
      hostname
    });
  }

  return hits;
}

function safeHost(urlString: string): string | undefined {
  try {
    return new URL(urlString).hostname;
  } catch {
    return undefined;
  }
}
