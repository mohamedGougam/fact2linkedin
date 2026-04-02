import { confidenceFromFact } from '@/lib/services/research/factConfidence';
import type { AdditionalSourceRef, Fact } from '@/lib/types/fact';

/** Word-overlap threshold for “nearly identical” (tunable). */
const JACCARD_THRESHOLD = 0.82;

/**
 * Collapse obvious duplicate facts using normalized text + token overlap.
 * Keeps the **first** occurrence’s wording and id; merges others into `additionalSourceRefs`
 * and raises `confidence` to the max of merged rows.
 */
export function deduplicateFacts(facts: Fact[]): Fact[] {
  const out: Fact[] = [];
  for (const fact of facts) {
    const dupIdx = out.findIndex((existing) => textsAreNearDuplicate(existing.text, fact.text));
    if (dupIdx === -1) {
      out.push({ ...fact });
    } else {
      out[dupIdx] = mergeDuplicateIntoKept(out[dupIdx], fact);
    }
  }
  return out;
}

function mergeDuplicateIntoKept(kept: Fact, incoming: Fact): Fact {
  const refs: AdditionalSourceRef[] = [...(kept.additionalSourceRefs ?? [])];
  const seenUrls = new Set<string>([
    kept.sourceUrl,
    ...refs.map((r) => r.sourceUrl)
  ]);

  if (!seenUrls.has(incoming.sourceUrl)) {
    seenUrls.add(incoming.sourceUrl);
    refs.push({
      sourceName: incoming.sourceName,
      sourceUrl: incoming.sourceUrl,
      sourceTitle: incoming.sourceTitle,
      sourceCategory: incoming.sourceCategory
    });
  }

  const merged: Fact = {
    ...kept,
    additionalSourceRefs: refs.length > 0 ? refs : kept.additionalSourceRefs
  };

  const rank = Math.min(
    kept.searchResultIndex ?? 999,
    incoming.searchResultIndex ?? 999
  );
  if (rank !== 999) {
    merged.searchResultIndex = rank;
  }

  merged.confidence = confidenceFromFact(merged, merged.searchResultIndex ?? 0);
  return merged;
}

function textsAreNearDuplicate(a: string, b: string): boolean {
  const na = normalizeForDedupe(a);
  const nb = normalizeForDedupe(b);
  if (na.length === 0 || nb.length === 0) return na === nb;

  if (na === nb) return true;

  // Very short claims: only exact normalized match or full containment of the shorter string.
  const minLen = Math.min(na.length, nb.length);
  if (minLen < 24) {
    if (na === nb) return true;
    const shorter = na.length <= nb.length ? na : nb;
    const longer = na.length > nb.length ? na : nb;
    return shorter.length >= 8 && longer.includes(shorter);
  }

  if (jaccard(wordSet(a), wordSet(b)) >= JACCARD_THRESHOLD) return true;

  // Longer snippets: one normalized string largely contains the other.
  if (na.includes(nb) || nb.includes(na)) {
    const ratio = minLen / Math.max(na.length, nb.length);
    return ratio >= 0.88;
  }

  return false;
}

/** Lowercase, strip punctuation, single spaces — for equality / overlap only. */
export function normalizeForDedupe(s: string): string {
  return s
    .toLowerCase()
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201c\u201d]/g, '"')
    .replace(/[^\p{L}\p{N}\s]+/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function wordSet(text: string): Set<string> {
  const n = normalizeForDedupe(text);
  const words = n.split(/\s+/).filter((w) => w.length > 0);
  return new Set(words);
}

function jaccard(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 && b.size === 0) return 1;
  if (a.size === 0 || b.size === 0) return 0;
  let inter = 0;
  for (const w of a) {
    if (b.has(w)) inter += 1;
  }
  const union = a.size + b.size - inter;
  return union === 0 ? 0 : inter / union;
}
