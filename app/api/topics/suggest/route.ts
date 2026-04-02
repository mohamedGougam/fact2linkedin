import { NextResponse } from 'next/server';
import { suggestTopicsAi } from '@/lib/services/aiTopicSuggestionsService';

/**
 * POST /api/topics/suggest
 *
 * Optional AI topic suggestions (requires `OPENAI_API_KEY`).
 * Deterministic fallback is done client-side for simplicity.
 */
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: 'Send JSON with currentTopic, researchMode, recentTopics, categories, and count.' },
      { status: 400 }
    );
  }

  const result = await suggestTopicsAi(body);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  return NextResponse.json({ topics: result.topics });
}

