import { appConfig } from '@/lib/config';
import { createBraveSearchProvider } from '@/lib/services/search/providers/braveWebSearch';
import { SearchUserError } from '@/lib/services/search/searchUserError';
import type { NormalizedSearchResult, SearchProvider } from '@/lib/services/search/types';

/**
 * Builds the active search provider from env. Today: Brave Web Search only.
 */
export function getSearchProvider(): SearchProvider {
  const key = appConfig.searchApiKey;
  const baseUrl = appConfig.searchApiUrl;
  if (!key || !baseUrl) {
    throw new SearchUserError(
      'Search is not configured on the server.',
      'auth'
    );
  }
  return createBraveSearchProvider({ apiKey: key, baseUrl });
}

/**
 * Runs a web search. Throws only {@link SearchUserError} with safe messages (no secrets).
 */
export async function searchWeb(query: string): Promise<NormalizedSearchResult[]> {
  const provider = getSearchProvider();
  return provider.search(query);
}

export type { NormalizedSearchResult, SearchProvider };
