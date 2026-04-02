/**
 * User-facing session warnings derived from research context and fact quality.
 * Same rules feed the UI and (via {@link mergeIssuesForHistory}) persisted run reports.
 */

import { getConfidenceBand } from '@/lib/confidenceLevel';
import type { ResearchModeStored, RunIssue } from '@/lib/contentRunReport';
import type { Fact } from '@/lib/types/fact';

export type SessionWarning = {
  id: string;
  /** Short, informative copy — not alarmist. */
  message: string;
};

export type SessionWarningContext = {
  /** What the user asked for in the UI. */
  requestedResearchMode: ResearchModeStored;
  /** What the API actually used to build facts (`null` before the first successful load). */
  researchPipelineUsed: 'mock' | 'web' | null;
  /** Optional note from `POST /api/facts` (e.g. web fallback). */
  researchInfo: string | null;
  facts: Fact[];
};

/**
 * Derive subtle, non-blocking warnings for the current session.
 */
export function deriveSessionWarnings(ctx: SessionWarningContext): SessionWarning[] {
  const seen = new Set<string>();
  const out: SessionWarning[] = [];

  function add(id: string, message: string) {
    if (seen.has(message)) return;
    seen.add(message);
    out.push({ id, message });
  }

  const info = ctx.researchInfo?.trim();
  if (info) {
    add('research-info', info);
  }

  const used = ctx.researchPipelineUsed;
  if (ctx.requestedResearchMode === 'web' && used === 'mock' && !info) {
    add(
      'fallback-pipeline',
      'Live web research wasn’t used for this load — sample facts are shown instead.'
    );
  }

  if (ctx.facts.length === 0) {
    return out;
  }

  const lowCount = ctx.facts.filter((f) => getConfidenceBand(f.confidence) === 'low').length;
  if (lowCount > 0) {
    add(
      'low-confidence',
      `${lowCount} fact${lowCount === 1 ? '' : 's'} ${lowCount === 1 ? 'has' : 'have'} a lower confidence score — worth a quick review before publishing to KAWN.`
    );
  }

  const missingDateCount = ctx.facts.filter((f) => !f.publishedAt?.trim()).length;
  if (missingDateCount > 0) {
    add(
      'no-publication-date',
      `${missingDateCount} source${missingDateCount === 1 ? '' : 's'} ${missingDateCount === 1 ? 'doesn’t' : 'don’t'} include a publication date in the data we received.`
    );
  }

  const mergedCount = ctx.facts.filter((f) => (f.additionalSourceRefs?.length ?? 0) > 0).length;
  if (mergedCount > 0) {
    add(
      'merged-sources',
      `${mergedCount} claim${mergedCount === 1 ? '' : 's'} combine overlapping pages (near-duplicate sources were merged).`
    );
  }

  return out;
}

export function sessionWarningsToRunIssues(warnings: SessionWarning[]): RunIssue[] {
  return warnings.map((w) => ({
    level: 'warning' as const,
    message: w.message,
    phase: 'research' as const
  }));
}

/**
 * Convenience for the main page: same warnings as the Notes panel, plus `RunIssue[]`
 * for export so files match what you see on screen.
 */
export function deriveSessionWarningsWithExportIssues(
  ctx: SessionWarningContext
): { warnings: SessionWarning[]; exportIssues: RunIssue[] } {
  const warnings = deriveSessionWarnings(ctx);
  return {
    warnings,
    exportIssues: sessionWarningsToRunIssues(warnings)
  };
}

/** Combine derived warnings with any explicit issues (e.g. future API flags), deduping by message. */
export function mergeIssuesForHistory(
  warnings: SessionWarning[],
  extra: RunIssue[] | undefined
): RunIssue[] {
  const fromWarnings = sessionWarningsToRunIssues(warnings);
  const seen = new Set(fromWarnings.map((i) => i.message));
  const merged = [...fromWarnings];
  for (const i of extra ?? []) {
    if (!seen.has(i.message)) {
      seen.add(i.message);
      merged.push(i);
    }
  }
  return merged;
}
