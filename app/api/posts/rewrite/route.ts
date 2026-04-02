import { NextResponse } from 'next/server';
import { rewriteLinkedInPost } from '@/lib/services/aiPostRewriteService';

/**
 * POST /api/posts/rewrite
 *
 * Body: `{ currentPost, facts, tone, length, postStyle }` — improves one draft using OpenAI
 * when `OPENAI_API_KEY` is set. Template generation is unchanged; this is an optional second step.
 */
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: 'Send JSON with currentPost, facts, tone, length, and postStyle.' },
      { status: 400 }
    );
  }

  const result = await rewriteLinkedInPost(body);

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  return NextResponse.json({ post: result.post });
}
