import type { Fact } from '@/lib/types/fact';

/**
 * Input every provider receives (expand later with locale, filters, etc.).
 */
export type ResearchRequest = {
  topic: string;
  /**
   * Explicit UI choice: `mock` | `live web`. When omitted, server uses `RESEARCH_PROVIDER` env (legacy).
   */
  researchMode?: 'mock' | 'web';
};

/**
 * Why live web research failed (for orchestrator fallback messaging). Not exposed in API JSON.
 */
export type WebFailureKind =
  | 'empty_results'
  | 'no_usable_facts'
  | 'extraction_failed'
  | 'network'
  | 'timeout'
  | 'http'
  | 'parse'
  | 'auth'
  | 'unknown';

/**
 * Same shape the API already returns: either facts or an error.
 */
export type ResearchResult =
  | {
      ok: true;
      facts: Fact[];
      /** Which pipeline actually produced the rows (after any fallback). */
      researchModeUsed: 'mock' | 'web';
      /** Shown when live web was requested but mock was used instead. */
      info?: string;
    }
  | {
      ok: false;
      error: string;
      status?: number;
      /** Set when `ok: false` comes from the web provider (orchestrator picks fallback copy). */
      webFailureKind?: WebFailureKind;
    };

/**
 * A “research provider” fetches facts for a topic (mock offline; web via search API).
 */
export interface ResearchProvider {
  readonly id: 'mock' | 'web';
  readonly label: string;
  fetchFacts(request: ResearchRequest): Promise<ResearchResult>;
}
