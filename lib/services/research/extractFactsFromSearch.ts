import type { NormalizedSearchResult } from '@/lib/services/search/types';
import { stripHtmlTags } from '@/lib/stripHtml';
import { computeFactConfidence } from '@/lib/services/research/factConfidence';
import {
  classifySourceCategory,
  isWeakSource
} from '@/lib/services/research/sourceRules';
import type { Fact, FactVerificationStatus } from '@/lib/types/fact';

const MAX_TEXT_LEN = 320;
const MIN_SENTENCE_LEN = 25;
const MIN_SNIPPET_LEN = 20;
const MIN_TITLE_LEN = 10;

export type ExtractFactsOptions = {
  /** Hard cap on total facts returned (order preserved). */
  maxTotalFacts: number;
  /** Max verbatim sentences taken from one search result’s snippet. */
  maxPerResult: number;
};

const DEFAULT_OPTIONS: ExtractFactsOptions = {
  maxTotalFacts: 9,
  maxPerResult: 2
};

/**
 * Deterministic extraction: only text that appears in the search API’s title/snippet/metadata.
 * No paraphrasing, no LLM. Multiple facts per result = multiple snippet sentences when safe.
 */
export function extractFactsFromSearchResults(
  hits: NormalizedSearchResult[],
  options: Partial<ExtractFactsOptions> = {}
): Fact[] {
  const { maxTotalFacts, maxPerResult } = { ...DEFAULT_OPTIONS, ...options };
  const out: Fact[] = [];

  for (let resultIndex = 0; resultIndex < hits.length; resultIndex++) {
    if (out.length >= maxTotalFacts) break;
    const hit = hits[resultIndex];
    if (isWeakSource(hit.hostname, hit.url)) {
      continue;
    }

    const title = stripHtmlTags(hit.title).trim();
    const description = stripHtmlTags(hit.description).trim();
    const publisher = hit.hostname?.trim() || undefined;
    const publishedAt = hit.age?.trim() || undefined;

    const candidates = collectSnippetCandidates(description, maxPerResult);

    if (candidates.length > 0) {
      for (let s = 0; s < candidates.length; s++) {
        if (out.length >= maxTotalFacts) break;
        const text = trimToMax(candidates[s], MAX_TEXT_LEN);
        out.push(
          buildFact({
            hit,
            title,
            text,
            verificationStatus: 'supported_snippet',
            publisher,
            publishedAt,
            resultIndex,
            sentenceIndex: s
          })
        );
      }
      continue;
    }

    if (description.length >= MIN_SNIPPET_LEN) {
      const text = trimToMax(description, MAX_TEXT_LEN);
      out.push(
        buildFact({
          hit,
          title,
          text,
          verificationStatus: 'supported_snippet_full',
          publisher,
          publishedAt,
          resultIndex,
          sentenceIndex: 0
        })
      );
      continue;
    }

    if (title.length >= MIN_TITLE_LEN) {
      const text = trimToMax(title, MAX_TEXT_LEN);
      out.push(
        buildFact({
          hit,
          title,
          text,
          verificationStatus: 'supported_title',
          publisher,
          publishedAt,
          resultIndex,
          sentenceIndex: 0
        })
      );
    }
  }

  return out;
}

/** Split snippet into sentences; keep only lines that are verbatim substrings and meet length. */
function collectSnippetCandidates(description: string, maxCount: number): string[] {
  if (!description) return [];

  const normalized = description.replace(/\s+/g, ' ').trim();
  const rawParts = normalized.split(/(?<=[.!?])\s+/).map((p) => p.trim());

  const seen = new Set<string>();
  const out: string[] = [];

  for (const part of rawParts) {
    if (out.length >= maxCount) break;
    if (part.length < MIN_SENTENCE_LEN) continue;
    if (!normalized.includes(part)) continue;
    if (seen.has(part)) continue;
    seen.add(part);
    out.push(part);
  }

  return out;
}

function trimToMax(s: string, max: number): string {
  const t = s.trim().replace(/\s+/g, ' ');
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1)}…`;
}

type BuildParams = {
  hit: NormalizedSearchResult;
  title: string;
  text: string;
  verificationStatus: FactVerificationStatus;
  publisher?: string;
  publishedAt?: string;
  resultIndex: number;
  sentenceIndex: number;
};

function buildFact(p: BuildParams): Fact {
  const id = makeFactId(p.hit.url, p.resultIndex, p.sentenceIndex, p.text);
  const sourceCategory = classifySourceCategory(p.hit.hostname, p.hit.url);

  const fact: Fact = {
    id,
    text: p.text,
    sourceName: p.title,
    sourceTitle: p.title,
    sourceType: 'article',
    sourceCategory,
    sourceUrl: p.hit.url,
    confidence: 0,
    publisher: p.publisher,
    publishedAt: p.publishedAt,
    verificationStatus: p.verificationStatus,
    searchResultIndex: p.resultIndex
  };
  fact.confidence = computeFactConfidence({
    sourceCategory,
    publisher: p.publisher,
    publishedAt: p.publishedAt,
    text: p.text,
    verificationStatus: p.verificationStatus,
    additionalSourceRefs: undefined,
    searchResultIndex: p.resultIndex
  });
  return fact;
}

/** Stable id without crypto — same inputs always yield the same id. */
function makeFactId(
  url: string,
  resultIndex: number,
  sentenceIndex: number,
  textPrefix: string
): string {
  const payload = [url, String(resultIndex), String(sentenceIndex), textPrefix.slice(0, 48)].join(
    '|'
  );
  return `f-${djb2Hex(payload)}`;
}

function djb2Hex(s: string): string {
  let hash = 5381;
  for (let i = 0; i < s.length; i++) {
    hash = (hash * 33) ^ s.charCodeAt(i);
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
}
