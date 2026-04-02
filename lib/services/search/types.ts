/**
 * Search layer types: normalized results look the same no matter which vendor API you use.
 */

/** One result row after parsing — safe for research / UI to consume. */
export type NormalizedSearchResult = {
  title: string;
  url: string;
  description: string;
  /** Relative age or date string from the vendor, if any. */
  age?: string;
  /** Hostname when known (from API metadata or parsed URL). */
  hostname?: string;
};

/**
 * Anything that can run a web query and return normalized hits.
 * Add new files under `providers/` and wire them in `searchClient.ts`.
 */
export type SearchProvider = {
  readonly id: string;
  search(query: string): Promise<NormalizedSearchResult[]>;
};
