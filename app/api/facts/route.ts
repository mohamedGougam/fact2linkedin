import { NextResponse } from 'next/server';
import { getFactsForTopic } from '@/lib/services/researchService';

// Thin route: parse JSON, delegate to research service, return JSON.

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: 'Send JSON with a topic field.' },
      { status: 400 }
    );
  }

  const result = await getFactsForTopic(body);

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  return NextResponse.json({
    facts: result.facts,
    researchModeUsed: result.researchModeUsed,
    ...(result.info ? { info: result.info } : {})
  });
}
