import type { PostStyle } from '@/lib/postStyle';
import type { Fact } from '@/lib/types/fact';
import type { PostLength } from '@/lib/post-length';
import type { Tone } from '@/lib/tone';

/**
 * Input for generating KAWN Post drafts (one per selected style).
 *
 * **Contract:** `facts` is the **only** exclusive set of claims to use — typically the client’s
 * current selection. The server does not merge in other facts from memory, cache, or research APIs.
 * Order is preserved; generation uses only `fact.text` for wording (metadata stays for traceability).
 */
export type PostGenerationRequest = {
  facts: Fact[];
  tone: Tone;
  length: PostLength;
  variant: number;
  /** Non-empty subset of archetypes to generate; order follows canonical post-style order. */
  postStyles: PostStyle[];
  /**
   * If set, only the post for `postStyles[regenerateStyleIndex]` is generated (one item in `posts`).
   * Omit for a full batch (one post per selected style).
   */
  regenerateStyleIndex?: number;
};

/** Provider output before the orchestrator attaches `factsUsed`. */
export type PostGenerationProviderResult =
  | { ok: true; posts: string[] }
  | { ok: false; error: string; status: number };

/**
 * Public outcome: on success, `factsUsed` matches the request facts; `postStylesUsed` matches
 * the styles that were generated (same order as `posts`).
 */
export type PostGenerationResult =
  | {
      ok: true;
      posts: string[];
      factsUsed: Fact[];
      postStylesUsed: PostStyle[];
      /** Echoed when a single slot was regenerated (merge client-side at this index). */
      regenerateStyleIndex?: number;
    }
  | { ok: false; error: string; status: number };

/**
 * Swappable backends: deterministic templates today, AI later.
 * Implementations must derive post text only from `request.facts` (e.g. `facts.map((f) => f.text)`).
 */
export interface PostGenerationProvider {
  readonly id: 'template' | 'ai';
  readonly label: string;
  generate(request: PostGenerationRequest): Promise<PostGenerationProviderResult>;
}
