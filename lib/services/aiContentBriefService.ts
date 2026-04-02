import { isOpenAiConfigured } from '@/lib/config';
import { isPostLength } from '@/lib/post-length';
import { isPostStyle, type PostStyle } from '@/lib/postStyle';
import { parseFact } from '@/lib/services/postGenerationService';
import { generateBriefWithOpenAI } from '@/lib/services/aiContentBrief/generateBriefWithOpenAI';
import { isTone } from '@/lib/tone';
import type { Fact } from '@/lib/types/fact';

const MAX_FACTS = 24;

export type ContentBriefOutcome =
  | { ok: true; brief: string }
  | { ok: false; error: string; status: number };

export async function generateContentBriefAi(body: unknown): Promise<ContentBriefOutcome> {
  if (!isOpenAiConfigured()) {
    return {
      ok: false,
      status: 503,
      error:
        'AI brief is not available. Add OPENAI_API_KEY to your server environment (e.g. .env.local).'
    };
  }

  if (body === null || typeof body !== 'object' || Array.isArray(body)) {
    return { ok: false, status: 400, error: 'Send JSON with topic, facts, tone, length, and postStyles.' };
  }

  const b = body as Record<string, unknown>;
  const topic = typeof b.topic === 'string' ? b.topic : '';

  if (!Array.isArray(b.facts) || b.facts.length === 0) {
    return { ok: false, status: 400, error: 'facts must be a non-empty array.' };
  }
  if (b.facts.length > MAX_FACTS) {
    return { ok: false, status: 400, error: `Too many facts (max ${MAX_FACTS}).` };
  }

  const facts: Fact[] = [];
  for (const item of b.facts) {
    const f = parseFact(item);
    if (!f) {
      return {
        ok: false,
        status: 400,
        error: 'Each fact must include text, sourceName, sourceType, sourceUrl, and confidence.'
      };
    }
    facts.push(f);
  }

  if (!isTone(b.tone)) {
    return { ok: false, status: 400, error: 'tone must be one of: professional, educational, bold, conversational.' };
  }
  if (!isPostLength(b.length)) {
    return { ok: false, status: 400, error: 'length must be one of: short, medium, long.' };
  }

  const postStyles: PostStyle[] = Array.isArray(b.postStyles)
    ? (b.postStyles.filter((s) => isPostStyle(s)) as PostStyle[])
    : [];

  const result = await generateBriefWithOpenAI({
    topic,
    facts,
    tone: b.tone,
    length: b.length,
    postStyles
  });

  if (!result.ok) {
    return { ok: false, status: 502, error: result.error };
  }

  return { ok: true, brief: result.brief };
}

