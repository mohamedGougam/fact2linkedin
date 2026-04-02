import { NextResponse } from 'next/server';
import { generateKawnPosts } from '@/lib/services/postGenerationService';

/**
 * POST /api/posts
 *
 * Body: `{ facts, tone, length, postStyles, variant?, regenerateStyleIndex? }` — full batch omits
 * `regenerateStyleIndex`; single-slot regen sets it to the index in `postStyles` for that card.
 */

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: 'Send JSON with facts, tone, length, and postStyles.' },
      { status: 400 }
    );
  }

  const result = await generateKawnPosts(body);

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  return NextResponse.json({
    posts: result.posts,
    factsUsed: result.factsUsed,
    postStylesUsed: result.postStylesUsed,
    ...(result.regenerateStyleIndex !== undefined && {
      regenerateStyleIndex: result.regenerateStyleIndex
    })
  });
}
