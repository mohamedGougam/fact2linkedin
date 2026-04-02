import { isOpenAiConfigured } from '@/lib/config';
import { suggestTopicsWithOpenAI } from '@/lib/services/aiTopicSuggestions/suggestTopicsWithOpenAI';

export type TopicSuggestionsOutcome =
  | { ok: true; topics: string[] }
  | { ok: false; error: string; status: number };

function isResearchMode(x: unknown): x is 'mock' | 'web' {
  return x === 'mock' || x === 'web';
}

/**
 * Optional AI topic suggestions (no persistence). Deterministic fallback is client-side.
 */
export async function suggestTopicsAi(body: unknown): Promise<TopicSuggestionsOutcome> {
  if (!isOpenAiConfigured()) {
    return {
      ok: false,
      status: 503,
      error:
        'AI topic suggestions are not available. Add OPENAI_API_KEY to your server environment (e.g. .env.local).'
    };
  }

  if (body === null || typeof body !== 'object' || Array.isArray(body)) {
    return { ok: false, status: 400, error: 'Send JSON with currentTopic, researchMode, recentTopics, categories, and count.' };
  }

  const b = body as Record<string, unknown>;
  const currentTopic = typeof b.currentTopic === 'string' ? b.currentTopic : '';
  const researchMode = isResearchMode(b.researchMode) ? b.researchMode : null;
  const recentTopics =
    Array.isArray(b.recentTopics) && b.recentTopics.every((x) => typeof x === 'string')
      ? (b.recentTopics as string[])
      : [];
  const categories =
    Array.isArray(b.categories) && b.categories.every((x) => typeof x === 'string')
      ? (b.categories as string[])
      : [];
  const count =
    typeof b.count === 'number' && Number.isFinite(b.count)
      ? Math.max(3, Math.min(12, Math.floor(b.count)))
      : 8;

  if (!researchMode) {
    return { ok: false, status: 400, error: 'researchMode must be mock or web.' };
  }

  const result = await suggestTopicsWithOpenAI({
    currentTopic,
    researchMode,
    recentTopics,
    categories,
    count
  });

  if (!result.ok) {
    return { ok: false, status: 502, error: result.error };
  }

  return { ok: true, topics: result.topics };
}

