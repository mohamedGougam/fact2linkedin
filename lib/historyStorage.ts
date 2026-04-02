import type { ContentRunReport, ResearchModeStored } from '@/lib/contentRunReport';
import { deriveSourcesFromFacts } from '@/lib/contentRunReport';
import { isPostStyle, type PostStyle } from '@/lib/postStyle';
import type { Fact } from '@/lib/types/fact';
import type { PostLength } from '@/lib/post-length';
import type { Tone } from '@/lib/tone';

export type { ResearchModeStored } from '@/lib/contentRunReport';

/**
 * One saved generation: structured run report + id.
 * Stored only in the browser (localStorage), not on a server.
 */

export type GenerationRun = {
  id: string;
  report: ContentRunReport;
};

/**
 * Normalized fields for displaying a run (handles legacy runs missing optional fields).
 */
export type HistoryRunSummary = {
  topic: string;
  /** User-facing label for research mode, or null if not stored on this run. */
  researchModeLabel: string | null;
  /** Total facts from research, or null if unknown (legacy run). */
  factsFound: number | null;
  factsSelected: number;
  postsGenerated: number;
  /** ISO 8601 string from the run. */
  timestamp: string;
};

export function summarizeHistoryRun(run: GenerationRun): HistoryRunSummary {
  const { report } = run;
  let researchModeLabel: string | null = null;
  if (report.researchMode === 'mock') researchModeLabel = 'Mock';
  else if (report.researchMode === 'web') researchModeLabel = 'Web';

  const factsFound =
    Array.isArray(report.facts) && report.facts.length > 0
      ? report.facts.length
      : null;

  return {
    topic: report.topic,
    researchModeLabel,
    factsFound,
    factsSelected: report.selectedFacts.length,
    postsGenerated: report.posts.length,
    timestamp: report.timestamp
  };
}

/** Legacy key prefix (pre–KAWN product name); unchanged so existing browser data still loads. */
const STORAGE_KEY = 'fact2linkedin-generation-history';
const MAX_RUNS = 40;

function newId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

/** Read all runs (newest first). Safe if storage is empty or corrupt. Migrates legacy flat rows. */
export function loadRuns(): GenerationRun[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((item) => normalizeStoredRun(item))
      .filter((r): r is GenerationRun => r !== null);
  } catch {
    return [];
  }
}

type LegacyFlatRun = {
  id: string;
  topic: string;
  selectedFacts: Fact[];
  posts: string[];
  tone: Tone;
  length: PostLength;
  postStyles?: PostStyle[];
  timestamp: string;
  researchMode?: ResearchModeStored;
  factsFoundCount?: number;
};

function normalizeStoredRun(x: unknown): GenerationRun | null {
  if (x === null || typeof x !== 'object') return null;
  const o = x as Record<string, unknown>;

  if (typeof o.id !== 'string') return null;

  if (o.report !== null && typeof o.report === 'object') {
    const rep = o.report as Record<string, unknown>;
    if (isContentRunReportShape(rep)) {
      return { id: o.id, report: rep as ContentRunReport };
    }
    return null;
  }

  if (isLegacyFlatRun(o)) {
    return { id: o.id, report: legacyFlatToReport(o) };
  }

  return null;
}

function isLegacyFlatRun(o: Record<string, unknown>): o is LegacyFlatRun & Record<string, unknown> {
  if (o.postStyles !== undefined) {
    if (!Array.isArray(o.postStyles) || !o.postStyles.every((p) => isPostStyle(p))) {
      return false;
    }
  }
  if (o.researchMode !== undefined && o.researchMode !== 'mock' && o.researchMode !== 'web') {
    return false;
  }
  if (o.factsFoundCount !== undefined) {
    if (
      typeof o.factsFoundCount !== 'number' ||
      !Number.isFinite(o.factsFoundCount) ||
      o.factsFoundCount < 0
    ) {
      return false;
    }
  }
  return (
    typeof o.topic === 'string' &&
    Array.isArray(o.selectedFacts) &&
    Array.isArray(o.posts) &&
    typeof o.tone === 'string' &&
    typeof o.length === 'string' &&
    typeof o.timestamp === 'string'
  );
}

function legacyFlatToReport(legacy: LegacyFlatRun): ContentRunReport {
  const selectedFacts = legacy.selectedFacts;
  return {
    topic: legacy.topic,
    researchMode: legacy.researchMode ?? 'mock',
    researchPipelineUsed: legacy.researchMode ?? 'mock',
    sources: deriveSourcesFromFacts(selectedFacts),
    facts: selectedFacts,
    selectedFacts,
    posts: legacy.posts,
    generationOptions: {
      tone: legacy.tone,
      length: legacy.length,
      postStyles: legacy.postStyles ?? [],
      templateVariant: 0
    },
    timestamp: legacy.timestamp,
    issues: []
  };
}

function isContentRunReportShape(rep: Record<string, unknown>): boolean {
  if (typeof rep.topic !== 'string') return false;
  if (rep.researchMode !== 'mock' && rep.researchMode !== 'web') return false;
  if (
    rep.researchPipelineUsed !== undefined &&
    rep.researchPipelineUsed !== 'mock' &&
    rep.researchPipelineUsed !== 'web'
  ) {
    return false;
  }
  if (
    rep.researchInfo !== undefined &&
    rep.researchInfo !== null &&
    typeof rep.researchInfo !== 'string'
  ) {
    return false;
  }
  if (!Array.isArray(rep.sources)) return false;
  if (!Array.isArray(rep.facts)) return false;
  if (!Array.isArray(rep.selectedFacts)) return false;
  if (!Array.isArray(rep.posts)) return false;
  if (rep.postFactsUsed !== undefined) {
    if (!Array.isArray(rep.postFactsUsed) || rep.postFactsUsed.length !== rep.posts.length) {
      return false;
    }
    for (const row of rep.postFactsUsed) {
      if (!Array.isArray(row)) return false;
    }
  }
  const go = rep.generationOptions;
  if (go === null || typeof go !== 'object') return false;
  const g = go as Record<string, unknown>;
  if (typeof g.tone !== 'string' || typeof g.length !== 'string') return false;
  if (!Array.isArray(g.postStyles) || !g.postStyles.every((p) => isPostStyle(p))) return false;
  if (typeof g.templateVariant !== 'number' || !Number.isFinite(g.templateVariant)) return false;
  if (typeof rep.timestamp !== 'string') return false;
  if (!isIssuesArray(rep.issues)) return false;
  if (
    rep.contentBrief !== undefined &&
    rep.contentBrief !== null &&
    typeof rep.contentBrief !== 'string'
  ) {
    return false;
  }
  return true;
}

function isIssuesArray(x: unknown): boolean {
  if (!Array.isArray(x)) return false;
  for (const iss of x) {
    if (iss === null || typeof iss !== 'object') return false;
    const o = iss as Record<string, unknown>;
    if (o.level !== 'warning' && o.level !== 'error') return false;
    if (typeof o.message !== 'string') return false;
  }
  return true;
}

/** Persist a new run; `timestamp` is set here. */
export function appendRun(
  partial: Omit<ContentRunReport, 'timestamp'>
): GenerationRun[] {
  const report: ContentRunReport = {
    ...partial,
    timestamp: new Date().toISOString()
  };
  const run: GenerationRun = { id: newId(), report };
  const next = [run, ...loadRuns()].slice(0, MAX_RUNS);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Quota or private mode — ignore; UI still works without persistence
  }
  return next;
}
