import type { PostStyle } from '@/lib/postStyle';
import type { Fact } from '@/lib/types/fact';

/** JSON body from `POST /api/facts`. */
export type FactsApiResponse = {
  facts?: Fact[];
  error?: string;
  /** Which pipeline produced the facts after any fallback. */
  researchModeUsed?: 'mock' | 'web';
  /** Friendly note when live web was requested but mock was used. */
  info?: string;
};

/** JSON body from `POST /api/posts`. */
export type PostsApiResponse = {
  posts?: string[];
  /** Server-validated facts that were used to build `posts` (same order as input). */
  factsUsed?: Fact[];
  /** Styles that were generated (same order as `posts`). */
  postStylesUsed?: PostStyle[];
  /** Present when only one slot was regenerated — merge `posts[0]` into that index client-side. */
  regenerateStyleIndex?: number;
  error?: string;
};

/** JSON body from `POST /api/posts/rewrite`. */
export type RewritePostApiResponse = {
  post?: string;
  error?: string;
};

/** JSON body from `POST /api/topics/suggest`. */
export type TopicSuggestionsApiResponse = {
  topics?: string[];
  error?: string;
};

/** JSON body from `POST /api/brief`. */
export type ContentBriefApiResponse = {
  brief?: string;
  error?: string;
};
