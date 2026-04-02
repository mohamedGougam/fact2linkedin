/**
 * Canonical snapshot of a completed content-draft run (research → generate → save).
 * Used for history persistence and file export so both paths stay aligned.
 */

import type { PostStyle } from '@/lib/postStyle';
import type { PostLength } from '@/lib/post-length';
import type { Fact } from '@/lib/types/fact';
import type { Tone } from '@/lib/tone';

/** Mock vs web research; aligned with UI and API. */
export type ResearchModeStored = 'mock' | 'web';

export type RunIssuePhase = 'research' | 'post_generation' | 'history' | 'other';

/** Non-fatal warnings or errors recorded during the run (API messages, validation, etc.). */
export type RunIssue = {
  level: 'warning' | 'error';
  message: string;
  phase?: RunIssuePhase;
};

/** One deduped source line for the report (from facts’ primary and additional refs). */
export type RunSourceLine = {
  sourceName: string;
  sourceUrl: string;
  /** Fact source type when known. */
  sourceType?: string;
};

/** Tone, length, styles, and template rotation used for generation. */
export type GenerationOptionsSnapshot = {
  tone: Tone;
  length: PostLength;
  postStyles: PostStyle[];
  /** Template variant index used for this generation (0-based). */
  templateVariant: number;
};

/**
 * Full structured report for one completed workflow (matches what we persist on history).
 */
export type ContentRunReport = {
  topic: string;
  /** Research mode selected in the UI when the run was saved. */
  researchMode: ResearchModeStored;
  /**
   * Pipeline that actually produced `facts` (from API). May differ from `researchMode`
   * when live web falls back to sample facts.
   */
  researchPipelineUsed?: ResearchModeStored;
  /** Optional note from the last `POST /api/facts` response. */
  researchInfo?: string | null;
  /** Distinct sources derived from all facts at save time. */
  sources: RunSourceLine[];
  /** All facts present in the editor when the run was saved. */
  facts: Fact[];
  /** Facts actually sent to post generation. */
  selectedFacts: Fact[];
  /** Generated post bodies (same order as `generationOptions.postStyles`). */
  posts: string[];
  /**
   * Facts snapshot used to build each post (same index as `posts`).
   * When omitted (older saves), treat {@link selectedFacts} as the set used for every slot.
   */
  postFactsUsed?: Fact[][];
  generationOptions: GenerationOptionsSnapshot;
  /** When the run completed (ISO 8601). */
  timestamp: string;
  issues: RunIssue[];
  /** Optional content brief generated in-session (not always in older saves). */
  contentBrief?: string;
};

/** Match facts for restore when object identity may differ (e.g. after JSON round-trip). */
export function isSameFact(a: Fact, b: Fact): boolean {
  if (a.id !== undefined && b.id !== undefined && a.id === b.id) return true;
  return a.text === b.text && a.sourceUrl === b.sourceUrl;
}

/** Collect unique source URLs from facts (primary + additional refs). */
export function deriveSourcesFromFacts(facts: Fact[]): RunSourceLine[] {
  const seen = new Set<string>();
  const out: RunSourceLine[] = [];

  function pushLine(name: string, url: string, sourceType?: string) {
    const key = url.trim().toLowerCase();
    if (!key || seen.has(key)) return;
    seen.add(key);
    out.push({
      sourceName: name || '(source)',
      sourceUrl: url,
      sourceType
    });
  }

  for (const f of facts) {
    pushLine(f.sourceName, f.sourceUrl, f.sourceType);
    if (f.additionalSourceRefs?.length) {
      for (const r of f.additionalSourceRefs) {
        pushLine(r.sourceName, r.sourceUrl);
      }
    }
  }

  return out;
}

/** Build a report for the current editor state (e.g. export before/without a history id). */
export function buildSessionContentRunReport(input: {
  topic: string;
  researchMode: ResearchModeStored;
  researchPipelineUsed?: ResearchModeStored | null;
  researchInfo?: string | null;
  facts: Fact[];
  selectedFacts: Fact[];
  posts: string[];
  postFactsUsed?: Fact[][];
  generationOptions: GenerationOptionsSnapshot;
  /** Defaults to now. */
  timestamp?: string;
  issues?: RunIssue[];
  contentBrief?: string | null;
}): ContentRunReport {
  const ts = input.timestamp ?? new Date().toISOString();
  const brief =
    typeof input.contentBrief === 'string' && input.contentBrief.trim().length > 0
      ? input.contentBrief.trim()
      : undefined;
  return {
    topic: input.topic,
    researchMode: input.researchMode,
    researchPipelineUsed:
      input.researchPipelineUsed === null || input.researchPipelineUsed === undefined
        ? undefined
        : input.researchPipelineUsed,
    researchInfo: input.researchInfo ?? undefined,
    sources: deriveSourcesFromFacts(input.facts),
    facts: input.facts,
    selectedFacts: input.selectedFacts,
    posts: input.posts,
    postFactsUsed: input.postFactsUsed,
    generationOptions: input.generationOptions,
    timestamp: ts,
    issues: input.issues ?? [],
    contentBrief: brief
  };
}

/** Facts tied to a post slot; falls back to the run’s selected facts for older reports. */
export function factsForPostSlot(report: ContentRunReport, postIndex: number): Fact[] {
  const per = report.postFactsUsed;
  if (per && per[postIndex] && per[postIndex].length > 0) {
    return per[postIndex];
  }
  return report.selectedFacts;
}
