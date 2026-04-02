import type { AdditionalSourceRef, Fact, FactVerificationStatus, SourceCategory } from '@/lib/types/fact';

/**
 * Deterministic confidence 0–100 from transparent rules (no ML).
 * Tune weights here as you learn what works.
 */

export type ConfidenceParams = {
  sourceCategory: SourceCategory | undefined;
  publisher?: string;
  publishedAt?: string;
  text: string;
  verificationStatus?: FactVerificationStatus;
  additionalSourceRefs?: AdditionalSourceRef[];
  /** 0 = top search hit; later hits get a small penalty. */
  searchResultIndex: number;
};

/** Re-score any fact (e.g. after dedup merge adds `additionalSourceRefs`). */
export function confidenceFromFact(fact: Fact, rankOverride?: number): number {
  const rank = rankOverride ?? fact.searchResultIndex ?? 0;
  return computeFactConfidence({
    sourceCategory: fact.sourceCategory,
    publisher: fact.publisher,
    publishedAt: fact.publishedAt,
    text: fact.text,
    verificationStatus: fact.verificationStatus,
    additionalSourceRefs: fact.additionalSourceRefs,
    searchResultIndex: rank
  });
}

export function computeFactConfidence(p: ConfidenceParams): number {
  if (p.verificationStatus === 'mock') {
    return mockTemplateConfidence(p.text);
  }

  let score = 0;

  score += pointsForSourceCategory(p.sourceCategory);
  score += hasPublisherMetadata(p.publisher) ? 12 : 0;
  score += hasDateMetadata(p.publishedAt) ? 10 : 0;
  score += pointsForSpecificity(p.text);
  score += pointsForVerification(p.verificationStatus);
  score += pointsForMultipleSources(p.additionalSourceRefs);
  score += pointsForSearchRank(p.searchResultIndex);

  score = Math.min(100, Math.round(score));
  // Avoid unusable scores for on-screen facts; keeps UX readable.
  return Math.max(34, score);
}

/** Offline mock facts: deterministic, tied to text length (no web signals). */
function mockTemplateConfidence(text: string): number {
  const spec = pointsForSpecificity(text);
  const score = 48 + Math.round(spec * 1.1) + 8;
  return Math.min(100, Math.max(52, score));
}

function pointsForSourceCategory(cat: SourceCategory | undefined): number {
  switch (cat) {
    case 'official':
      return 26;
    case 'research':
      return 22;
    case 'publication':
      return 18;
    case 'blog':
      return 10;
    case 'unknown':
    default:
      return 6;
  }
}

function hasPublisherMetadata(publisher?: string): boolean {
  return typeof publisher === 'string' && publisher.trim().length > 0;
}

function hasDateMetadata(publishedAt?: string): boolean {
  return typeof publishedAt === 'string' && publishedAt.trim().length > 0;
}

/** More words → more specific claim (capped). */
function pointsForSpecificity(text: string): number {
  const wc = wordCount(text);
  if (wc >= 22) return 20;
  if (wc >= 14) return 16;
  if (wc >= 9) return 12;
  if (wc >= 5) return 8;
  return 4;
}

function wordCount(text: string): number {
  return text
    .trim()
    .split(/\s+/)
    .filter((w) => w.length > 0).length;
}

function pointsForVerification(v: FactVerificationStatus | undefined): number {
  switch (v) {
    case 'supported_snippet':
      return 13;
    case 'supported_snippet_full':
      return 11;
    case 'supported_title':
      return 5;
    case 'mock':
      return 10;
    case 'unverified':
    default:
      return 6;
  }
}

/** Extra agreement when the same wording is supported by more than one URL. */
function pointsForMultipleSources(refs: AdditionalSourceRef[] | undefined): number {
  const n = refs?.length ?? 0;
  return Math.min(15, n * 5);
}

/** Prefer earlier search results (deterministic rank prior). */
function pointsForSearchRank(resultIndex: number): number {
  const table = [10, 8, 6, 4, 2, 0];
  return resultIndex >= 0 && resultIndex < table.length ? table[resultIndex] : 0;
}

/**
 * One-line explanation for tooltips (no ML — lists which rules fired).
 */
export function describeConfidenceFactors(fact: Fact, rankOverride?: number): string {
  const rank = rankOverride ?? fact.searchResultIndex ?? 0;
  const p: ConfidenceParams = {
    sourceCategory: fact.sourceCategory,
    publisher: fact.publisher,
    publishedAt: fact.publishedAt,
    text: fact.text,
    verificationStatus: fact.verificationStatus,
    additionalSourceRefs: fact.additionalSourceRefs,
    searchResultIndex: rank
  };

  if (p.verificationStatus === 'mock') {
    return `Mock template · specificity · ${Math.round(confidenceFromFact(fact, rank))}/100`;
  }

  const parts: string[] = [];
  parts.push(`Source class: ${p.sourceCategory ?? 'unknown'}`);
  if (hasPublisherMetadata(p.publisher)) parts.push('publisher');
  if (hasDateMetadata(p.publishedAt)) parts.push('date');
  parts.push(`specificity (~${wordCount(p.text)} words)`);
  parts.push(`grounding: ${p.verificationStatus ?? 'unverified'}`);
  const extra = p.additionalSourceRefs?.length ?? 0;
  if (extra > 0) parts.push(`+${extra} corroborating source(s)`);
  parts.push(`search rank #${p.searchResultIndex + 1}`);
  parts.push(`→ ${Math.round(confidenceFromFact(fact, rank))}/100`);
  return parts.join(' · ');
}
