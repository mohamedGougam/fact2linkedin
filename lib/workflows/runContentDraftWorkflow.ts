/**
 * Client-side workflow orchestration for KAWN Content Creator Agent.
 *
 * Responsibilities (UI calls these; they are **not** React components):
 * - **Research** — `runResearchPhase` → `POST /api/facts`
 * - **Filter** — `filterFactsForGeneration` (pure)
 * - **Posts** — `runGeneratePostsPhase` / `runRegenerateSinglePostPhase` → `POST /api/posts`
 * - **History payload** — `packageHistoryRun` → data for `appendRun` in `historyStorage.ts`
 *
 * End-to-end order today: research → filter → generate → save snapshot.
 * Schedulers or workers can reuse the same functions later; this file does not run cron jobs.
 */

import type { ContentRunReport, ResearchModeStored, RunIssue } from '@/lib/contentRunReport';
import { deriveSourcesFromFacts } from '@/lib/contentRunReport';
import { deriveSessionWarnings, mergeIssuesForHistory } from '@/lib/sessionWarnings';
import type { PostStyle } from '@/lib/postStyle';
import type { PostLength } from '@/lib/post-length';
import type { FactsApiResponse, PostsApiResponse } from '@/lib/types/api';
import type { Fact } from '@/lib/types/fact';
import type { Tone } from '@/lib/tone';

// --- Research phase ---

export type ResearchPhaseInput = {
  topic: string;
  /** Same as UI research mode (`mock` | `web`). */
  researchMode: ResearchModeStored;
};

export type ResearchPhaseSuccess = {
  ok: true;
  facts: Fact[];
  /** Optional banner copy from the API. */
  info: string | null;
  /** Which pipeline produced `facts` (may differ from requested mode after fallback). */
  researchModeUsed: 'mock' | 'web';
};

export type ResearchPhaseFailure = {
  ok: false;
  error: string;
};

export type ResearchPhaseResult = ResearchPhaseSuccess | ResearchPhaseFailure;

export async function runResearchPhase(
  input: ResearchPhaseInput
): Promise<ResearchPhaseResult> {
  try {
    const response = await fetch('/api/facts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        topic: input.topic,
        researchMode: input.researchMode
      })
    });

    const data = (await response.json()) as FactsApiResponse;

    if (!response.ok) {
      return { ok: false, error: data.error ?? 'Could not load facts.' };
    }

    const facts = data.facts ?? [];
    const info =
      typeof data.info === 'string' && data.info.trim() ? data.info.trim() : null;
    const researchModeUsed: 'mock' | 'web' =
      data.researchModeUsed === 'web' ? 'web' : 'mock';

    return { ok: true, facts, info, researchModeUsed };
  } catch {
    return {
      ok: false,
      error: 'Could not reach the server. Is `npm run dev` running?'
    };
  }
}

// --- Fact filtering (pure; mirrors UI selection arrays) ---

/**
 * Returns facts whose index is selected — the set passed into post generation.
 */
export function filterFactsForGeneration(
  facts: Fact[],
  selected: boolean[]
): Fact[] {
  return facts.filter((_, i) => Boolean(selected[i]));
}

// --- Post generation phase ---

export type GeneratePostsPhaseInput = {
  facts: Fact[];
  tone: Tone;
  length: PostLength;
  variant: number;
  postStyles: PostStyle[];
};

export type GeneratePostsPhaseSuccess = {
  ok: true;
  posts: string[];
  /** Facts persisted on the response, or the input facts if omitted. */
  factsUsed: Fact[];
};

export type GeneratePostsPhaseFailure = {
  ok: false;
  error: string;
};

export type GeneratePostsPhaseResult =
  | GeneratePostsPhaseSuccess
  | GeneratePostsPhaseFailure;

export async function runGeneratePostsPhase(
  input: GeneratePostsPhaseInput
): Promise<GeneratePostsPhaseResult> {
  try {
    const response = await fetch('/api/posts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        facts: input.facts,
        tone: input.tone,
        length: input.length,
        variant: input.variant,
        postStyles: input.postStyles
      })
    });

    const data = (await response.json()) as PostsApiResponse;

    if (!response.ok) {
      return { ok: false, error: data.error ?? 'Could not generate posts.' };
    }

    const posts = data.posts ?? [];
    const factsUsed = Array.isArray(data.factsUsed) ? data.factsUsed : input.facts;

    return { ok: true, posts, factsUsed };
  } catch {
    return {
      ok: false,
      error: 'Could not reach the server. Is `npm run dev` running?'
    };
  }
}

export type RegenerateSinglePostPhaseInput = GeneratePostsPhaseInput & {
  regenerateStyleIndex: number;
};

export type RegenerateSinglePostPhaseSuccess = {
  ok: true;
  post: string;
  regenerateStyleIndex: number;
};

export type RegenerateSinglePostPhaseFailure = {
  ok: false;
  error: string;
};

export type RegenerateSinglePostPhaseResult =
  | RegenerateSinglePostPhaseSuccess
  | RegenerateSinglePostPhaseFailure;

export async function runRegenerateSinglePostPhase(
  input: RegenerateSinglePostPhaseInput
): Promise<RegenerateSinglePostPhaseResult> {
  try {
    const response = await fetch('/api/posts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        facts: input.facts,
        tone: input.tone,
        length: input.length,
        variant: input.variant,
        postStyles: input.postStyles,
        regenerateStyleIndex: input.regenerateStyleIndex
      })
    });

    const data = (await response.json()) as PostsApiResponse;

    if (!response.ok) {
      return { ok: false, error: data.error ?? 'Could not regenerate this post.' };
    }

    const idx = data.regenerateStyleIndex;
    const one = data.posts?.[0];

    if (typeof idx !== 'number' || typeof one !== 'string') {
      return {
        ok: false,
        error: 'Could not regenerate this post.'
      };
    }

    return { ok: true, post: one, regenerateStyleIndex: idx };
  } catch {
    return {
      ok: false,
      error: 'Could not reach the server. Is `npm run dev` running?'
    };
  }
}

// --- History packaging (pure; feeds `appendRun`) ---

export type HistoryPackageInput = {
  topic: string;
  /** All facts in the editor when the run completes. */
  facts: Fact[];
  selectedFacts: Fact[];
  posts: string[];
  /** Per-slot fact snapshots (same length as `posts`); omit to derive from `selectedFacts` on read. */
  postFactsUsed?: Fact[][];
  tone: Tone;
  length: PostLength;
  postStyles: PostStyle[];
  /** UI research mode (requested). */
  researchMode: ResearchModeStored;
  /** Actual pipeline used for the current fact set (`null` if unknown). */
  researchPipelineUsed: 'mock' | 'web' | null;
  /** Last research API note (e.g. fallback). */
  researchInfo: string | null;
  templateVariant: number;
  issues?: RunIssue[];
};

/**
 * Build the payload persisted by {@link appendRun} (`timestamp` added in storage).
 */
export function packageHistoryRun(
  input: HistoryPackageInput
): Omit<ContentRunReport, 'timestamp'> {
  const warnings = deriveSessionWarnings({
    requestedResearchMode: input.researchMode,
    researchPipelineUsed: input.researchPipelineUsed,
    researchInfo: input.researchInfo,
    facts: input.facts
  });

  const issues = mergeIssuesForHistory(warnings, input.issues);

  return {
    topic: input.topic,
    researchMode: input.researchMode,
    researchPipelineUsed:
      input.researchPipelineUsed === null ? undefined : input.researchPipelineUsed,
    researchInfo: input.researchInfo ?? undefined,
    sources: deriveSourcesFromFacts(input.facts),
    facts: input.facts,
    selectedFacts: input.selectedFacts,
    posts: input.posts,
    postFactsUsed: input.postFactsUsed,
    generationOptions: {
      tone: input.tone,
      length: input.length,
      postStyles: input.postStyles,
      templateVariant: input.templateVariant
    },
    issues
  };
}
