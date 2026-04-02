/**
 * Shared shape for a researched claim plus where it came from.
 * Post generation uses `text`; the rest is for display and future filtering.
 */

export type SourceType = 'article' | 'report' | 'documentation' | 'dataset' | 'mock';

export const SOURCE_TYPES: SourceType[] = [
  'article',
  'report',
  'documentation',
  'dataset',
  'mock'
];

/**
 * How the fact text relates to fetched material (deterministic extraction — no LLM).
 * `unverified` is used for legacy client data or missing field.
 */
export type FactVerificationStatus =
  | 'supported_snippet' // sentence taken verbatim from the search snippet
  | 'supported_snippet_full' // entire snippet used as one fact (no split)
  | 'supported_title' // only the result title was usable as the claim text
  | 'mock' // offline mock templates
  | 'unverified'; // unknown / not set

export const FACT_VERIFICATION_STATUSES: FactVerificationStatus[] = [
  'supported_snippet',
  'supported_snippet_full',
  'supported_title',
  'mock',
  'unverified'
];

/**
 * High-level source bucket (domain/metadata heuristics). Separate from `sourceType` (article/report/…).
 */
export type SourceCategory = 'official' | 'research' | 'publication' | 'blog' | 'unknown';

export const SOURCE_CATEGORIES: SourceCategory[] = [
  'official',
  'research',
  'publication',
  'blog',
  'unknown'
];

/** Extra sources when two near-duplicate facts were merged (primary fields stay on `Fact`). */
export type AdditionalSourceRef = {
  sourceName: string;
  sourceUrl: string;
  sourceTitle?: string;
  sourceCategory?: SourceCategory;
};

export type Fact = {
  /** Stable id for this fact (deterministic for web extraction). Omitted in very old saved history. */
  id?: string;
  /** The sentence used in LinkedIn drafts (the “claim”). */
  text: string;
  /** Short label for the source (often page title or site name). */
  sourceName: string;
  /** Page / result title from the search API. */
  sourceTitle?: string;
  sourceType: SourceType;
  /** Domain-based bucket (official / research / …). May be missing on old saved runs. */
  sourceCategory?: SourceCategory;
  sourceUrl: string;
  /** 0-based index of the search hit this fact came from (for confidence rank). */
  searchResultIndex?: number;
  /** Other URLs that supported the same (or merged) claim after deduplication. */
  additionalSourceRefs?: AdditionalSourceRef[];
  /** 0–100; rank- and split-based for web, heuristics for mocks. */
  confidence: number;
  /** Publisher or site name when known. */
  publisher?: string;
  /** Published time or age string from the provider (not always ISO). */
  publishedAt?: string;
  /**
   * How the claim is grounded in fetched content. Always set for new API results;
   * may be missing on older saved browser history.
   */
  verificationStatus?: FactVerificationStatus;
};

export function isSourceType(value: unknown): value is SourceType {
  return typeof value === 'string' && (SOURCE_TYPES as string[]).includes(value);
}

export function isFactVerificationStatus(
  value: unknown
): value is FactVerificationStatus {
  return typeof value === 'string' && (FACT_VERIFICATION_STATUSES as string[]).includes(value);
}

export function isSourceCategory(value: unknown): value is SourceCategory {
  return typeof value === 'string' && (SOURCE_CATEGORIES as string[]).includes(value);
}
