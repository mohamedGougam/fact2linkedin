/**
 * Optional AI rewrite of an already-generated KAWN Post draft.
 * Template generation stays the default; this layer only polishes existing text.
 */

import { isOpenAiConfigured } from '@/lib/config';
import { isPostStyle } from '@/lib/postStyle';
import { isPostLength } from '@/lib/post-length';
import { parseFact } from '@/lib/services/postGenerationService';
import { rewritePostWithOpenAI } from '@/lib/services/aiPostRewrite/rewritePostWithOpenAI';
import { type PostQuickEditAction } from '@/lib/postQuickEdits';
import { isTone } from '@/lib/tone';

const MAX_FACTS = 24;

export type RewritePostOutcome =
  | { ok: true; post: string }
  | { ok: false; error: string; status: number };

function isQuickEditAction(x: unknown): x is PostQuickEditAction {
  return (
    x === 'shorter' ||
    x === 'executive' ||
    x === 'engaging' ||
    x === 'remove_hashtags' ||
    x === 'add_cta'
  );
}

function actionToEditGoal(action: PostQuickEditAction): string {
  switch (action) {
    case 'shorter':
      return 'Make the post shorter while preserving the key message.';
    case 'executive':
      return 'Make it more executive: crisp, structured, no fluff.';
    case 'engaging':
      return 'Make it more engaging while staying professional.';
    case 'remove_hashtags':
      return 'Remove all hashtags from the post.';
    case 'add_cta':
      return 'Add a clear, tasteful call-to-action at the end (no aggressive sales tone).';
  }
}

/**
 * Validates JSON body and runs OpenAI rewrite when configured.
 */
export async function rewriteKawnPost(body: unknown): Promise<RewritePostOutcome> {
  if (!isOpenAiConfigured()) {
    return {
      ok: false,
      error:
        'AI improve is not available. Add OPENAI_API_KEY to your server environment (e.g. .env.local).',
      status: 503
    };
  }

  if (body === null || typeof body !== 'object' || Array.isArray(body)) {
    return { ok: false, error: 'Send JSON with currentPost, facts, tone, length, and postStyle.', status: 400 };
  }

  const b = body as Record<string, unknown>;

  if (typeof b.currentPost !== 'string' || b.currentPost.trim().length === 0) {
    return { ok: false, error: 'currentPost must be a non-empty string.', status: 400 };
  }

  const editGoal =
    typeof b.editGoal === 'string' && b.editGoal.trim().length > 0
      ? b.editGoal.trim()
      : null;
  const editAction = isQuickEditAction(b.editAction) ? b.editAction : null;

  if (!Array.isArray(b.facts) || b.facts.length === 0) {
    return { ok: false, error: 'facts must be a non-empty array.', status: 400 };
  }

  if (b.facts.length > MAX_FACTS) {
    return { ok: false, error: `Too many facts (max ${MAX_FACTS}).`, status: 400 };
  }

  const facts = [];
  for (const item of b.facts) {
    const f = parseFact(item);
    if (!f) {
      return {
        ok: false,
        error: 'Each fact must include text, sourceName, sourceType, sourceUrl, and confidence.',
        status: 400
      };
    }
    facts.push(f);
  }

  if (!isTone(b.tone)) {
    return {
      ok: false,
      error: 'tone must be one of: professional, educational, bold, conversational.',
      status: 400
    };
  }

  if (!isPostLength(b.length)) {
    return { ok: false, error: 'length must be one of: short, medium, long.', status: 400 };
  }

  if (!isPostStyle(b.postStyle)) {
    return {
      ok: false,
      error: 'postStyle must be a valid post style id.',
      status: 400
    };
  }

  const result = await rewritePostWithOpenAI({
    facts,
    tone: b.tone,
    length: b.length,
    postStyle: b.postStyle,
    currentPost: b.currentPost,
    editGoal: editGoal ?? (editAction ? actionToEditGoal(editAction) : undefined)
  });

  if (!result.ok) {
    return { ok: false, error: result.error, status: 502 };
  }

  return { ok: true, post: result.post };
}
