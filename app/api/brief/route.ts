import { NextResponse } from 'next/server';
import { generateContentBriefAi } from '@/lib/services/aiContentBriefService';

/**
 * POST /api/brief
 *
 * Optional AI enhancement for a content brief (requires OPENAI_API_KEY).
 * Client has a deterministic fallback.
 */
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: 'Send JSON with topic, facts, tone, length, and postStyles.' },
      { status: 400 }
    );
  }

  const result = await generateContentBriefAi(body);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  return NextResponse.json({ brief: result.brief });
}

