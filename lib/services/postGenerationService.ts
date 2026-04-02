import { runPostGeneration } from '@/lib/services/postGeneration/postGenerationOrchestrator';
import type { PostGenerationResult } from '@/lib/services/postGeneration/types';
import { normalizePostStyles } from '@/lib/postStyle';
import { isPostLength } from '@/lib/post-length';
import {
  isFactVerificationStatus,
  isSourceCategory,
  isSourceType
} from '@/lib/types/fact';
import type { AdditionalSourceRef, Fact } from '@/lib/types/fact';
import { isTone } from '@/lib/tone';

/** Same shape as `PostGenerationResult` — exported for the API route. */
export type GeneratePostsOutcome = PostGenerationResult;

/** Hard cap on facts per request (client should send only the user’s current selection). */
const MAX_FACTS_PER_REQUEST = 24;

/**
 * Validates `{ facts, tone, length, postStyles, variant? }` and returns one post per selected style.
 * (templates by default).
 *
 * **Trust:** The `facts` array is the exclusive input set — nothing is merged from research APIs
 * or session state. Post bodies are built only from `fact.text` fields; validated metadata is
 * returned as `factsUsed` for traceability.
 */
export async function generateKawnPosts(body: unknown): Promise<GeneratePostsOutcome> {
  if (body === null || typeof body !== 'object' || Array.isArray(body)) {
    return {
      ok: false,
      error: 'Send JSON with facts, tone, length, and postStyles.',
      status: 400
    };
  }

  const b = body as {
    facts?: unknown;
    tone?: unknown;
    length?: unknown;
    postStyles?: unknown;
    variant?: unknown;
    regenerateStyleIndex?: unknown;
  };

  const raw = b.facts;
  if (!Array.isArray(raw) || raw.length === 0) {
    return {
      ok: false,
      error: 'Send a non-empty facts array with at least one valid fact.',
      status: 400
    };
  }

  if (raw.length > MAX_FACTS_PER_REQUEST) {
    return {
      ok: false,
      error: `Too many facts in one request (max ${MAX_FACTS_PER_REQUEST}). Send only the facts you want to use.`,
      status: 400
    };
  }

  const parsed: Fact[] = [];
  for (const item of raw) {
    const fact = parseFact(item);
    if (!fact) {
      return {
        ok: false,
        error:
          'Each fact needs text, sourceName, sourceType, sourceUrl, and confidence (0–100).',
        status: 400
      };
    }
    parsed.push(fact);
  }

  const postStyles = normalizePostStyles(b.postStyles);
  if (!postStyles) {
    return {
      ok: false,
      error:
        'postStyles must be a non-empty array of valid ids: professional_insight, educational, bold_thought_leadership, storytelling, statistic_led.',
      status: 400
    };
  }

  if (!isTone(b.tone)) {
    return {
      ok: false,
      error:
        'tone must be one of: professional, educational, bold, conversational.',
      status: 400
    };
  }

  if (!isPostLength(b.length)) {
    return {
      ok: false,
      error: 'length must be one of: short, medium, long.',
      status: 400
    };
  }

  let variant = 0;
  if (b.variant !== undefined && b.variant !== null) {
    if (
      typeof b.variant !== 'number' ||
      !Number.isFinite(b.variant) ||
      b.variant < 0
    ) {
      return {
        ok: false,
        error: 'variant must be a non-negative number.',
        status: 400
      };
    }
    variant = Math.floor(b.variant);
  }

  let regenerateStyleIndex: number | undefined;
  if (b.regenerateStyleIndex !== undefined && b.regenerateStyleIndex !== null) {
    if (typeof b.regenerateStyleIndex !== 'number' || !Number.isInteger(b.regenerateStyleIndex)) {
      return {
        ok: false,
        error: 'regenerateStyleIndex must be an integer when provided.',
        status: 400
      };
    }
    if (b.regenerateStyleIndex < 0 || b.regenerateStyleIndex >= postStyles.length) {
      return {
        ok: false,
        error: 'regenerateStyleIndex must be a valid index into postStyles.',
        status: 400
      };
    }
    regenerateStyleIndex = b.regenerateStyleIndex;
  }

  return runPostGeneration({
    facts: parsed,
    tone: b.tone,
    length: b.length,
    variant,
    postStyles,
    regenerateStyleIndex
  });
}

/** Exported for other services (e.g. AI rewrite) that accept the same client fact JSON. */
export function parseFact(item: unknown): Fact | null {
  if (item === null || typeof item !== 'object' || Array.isArray(item)) {
    return null;
  }
  const o = item as Record<string, unknown>;

  if (typeof o.text !== 'string' || o.text.trim().length === 0) {
    return null;
  }
  if (typeof o.sourceName !== 'string' || o.sourceName.trim().length === 0) {
    return null;
  }
  if (!isSourceType(o.sourceType)) {
    return null;
  }
  if (typeof o.sourceUrl !== 'string' || o.sourceUrl.trim().length === 0) {
    return null;
  }
  if (
    typeof o.confidence !== 'number' ||
    !Number.isFinite(o.confidence) ||
    o.confidence < 0 ||
    o.confidence > 100
  ) {
    return null;
  }

  if (o.sourceTitle !== undefined && typeof o.sourceTitle !== 'string') {
    return null;
  }
  if (o.publisher !== undefined && typeof o.publisher !== 'string') {
    return null;
  }
  if (o.publishedAt !== undefined && typeof o.publishedAt !== 'string') {
    return null;
  }
  if (o.sourceCategory !== undefined && !isSourceCategory(o.sourceCategory)) {
    return null;
  }
  if (o.searchResultIndex !== undefined && o.searchResultIndex !== null) {
    if (
      typeof o.searchResultIndex !== 'number' ||
      !Number.isFinite(o.searchResultIndex) ||
      o.searchResultIndex < 0 ||
      !Number.isInteger(o.searchResultIndex)
    ) {
      return null;
    }
  }
  const id =
    typeof o.id === 'string' && o.id.trim().length > 0
      ? o.id.trim()
      : legacyFactId(o.text as string, o.sourceUrl as string);

  let verificationStatus: Fact['verificationStatus'];
  if (o.verificationStatus === undefined || o.verificationStatus === null) {
    verificationStatus = 'unverified';
  } else if (isFactVerificationStatus(o.verificationStatus)) {
    verificationStatus = o.verificationStatus;
  } else {
    return null;
  }

  const fact: Fact = {
    id,
    text: o.text,
    sourceName: o.sourceName,
    sourceType: o.sourceType,
    sourceUrl: o.sourceUrl,
    confidence: o.confidence,
    verificationStatus
  };
  if (typeof o.sourceTitle === 'string') fact.sourceTitle = o.sourceTitle;
  if (typeof o.sourceCategory === 'string' && isSourceCategory(o.sourceCategory)) {
    fact.sourceCategory = o.sourceCategory;
  }
  if (typeof o.searchResultIndex === 'number') fact.searchResultIndex = o.searchResultIndex;
  if (typeof o.publisher === 'string') fact.publisher = o.publisher;
  if (typeof o.publishedAt === 'string') fact.publishedAt = o.publishedAt;

  const extra = parseAdditionalSourceRefs(o.additionalSourceRefs);
  if (extra === null && o.additionalSourceRefs !== undefined && o.additionalSourceRefs !== null) {
    return null;
  }
  if (extra && extra.length > 0) fact.additionalSourceRefs = extra;

  return fact;
}

function parseAdditionalSourceRefs(raw: unknown): AdditionalSourceRef[] | undefined | null {
  if (raw === undefined || raw === null) return undefined;
  if (!Array.isArray(raw)) return null;
  const out: AdditionalSourceRef[] = [];
  for (const item of raw) {
    if (item === null || typeof item !== 'object' || Array.isArray(item)) return null;
    const r = item as Record<string, unknown>;
    if (typeof r.sourceName !== 'string' || r.sourceName.trim().length === 0) return null;
    if (typeof r.sourceUrl !== 'string' || r.sourceUrl.trim().length === 0) return null;
    if (r.sourceTitle !== undefined && typeof r.sourceTitle !== 'string') return null;
    if (r.sourceCategory !== undefined && !isSourceCategory(r.sourceCategory)) return null;
    const ref: AdditionalSourceRef = {
      sourceName: r.sourceName,
      sourceUrl: r.sourceUrl
    };
    if (typeof r.sourceTitle === 'string') ref.sourceTitle = r.sourceTitle;
    if (isSourceCategory(r.sourceCategory)) ref.sourceCategory = r.sourceCategory;
    out.push(ref);
  }
  return out;
}

function legacyFactId(text: string, url: string): string {
  const s = `${text}|${url}`;
  let h = 5381;
  for (let i = 0; i < s.length; i++) {
    h = (h * 33) ^ s.charCodeAt(i);
  }
  return `legacy-${(h >>> 0).toString(16)}`;
}
