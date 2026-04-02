import { POST_STYLE_LABELS, type PostStyle } from '@/lib/postStyle';
import type { PostLength } from '@/lib/post-length';
import type { Fact } from '@/lib/types/fact';
import type { Tone } from '@/lib/tone';

function lengthHint(length: PostLength): string {
  switch (length) {
    case 'short':
      return 'Keep it concise for LinkedIn (about 1–3 short paragraphs).';
    case 'medium':
      return 'Use a medium length (several short paragraphs).';
    case 'long':
      return 'You may use a longer post (multiple paragraphs) while staying readable.';
    default:
      return '';
  }
}

/**
 * System instructions: rewrite only; never invent claims beyond the fact list.
 */
export function rewriteSystemPrompt(): string {
  return [
    'You are an expert LinkedIn editor.',
    'You improve drafts for clarity, flow, and professional tone.',
    'You must NOT introduce new factual claims, numbers, names, dates, or citations that are not clearly supported by the FACTS list provided in the user message.',
    'If the draft contains something not supported by those facts, remove it or rephrase so it stays faithful to the facts.',
    'Do not add hashtags unless the draft already uses that style and it fits.',
    'Output plain text only: the post body. No surrounding quotes, no markdown code fences, no preamble like "Here is the post:".'
  ].join(' ');
}

export function rewriteUserPrompt(input: {
  facts: Fact[];
  tone: Tone;
  length: PostLength;
  postStyle: PostStyle;
  currentPost: string;
  /** Optional extra objective (e.g., “remove hashtags”, “make shorter”). */
  editGoal?: string;
}): string {
  const factLines = input.facts.map((f, i) => `${i + 1}. ${f.text.trim()}`).join('\n');

  return [
    'FACTS (only claims you may rely on — do not go beyond these):',
    factLines || '(none — keep edits minimal and do not invent content.)',
    '',
    `Voice tone: ${input.tone}`,
    `Target length: ${input.length} (${lengthHint(input.length)})`,
    `Post style: ${POST_STYLE_LABELS[input.postStyle]}`,
    input.editGoal ? `Edit goal: ${input.editGoal}` : null,
    '',
    'CURRENT DRAFT:',
    input.currentPost.trim(),
    '',
    [
      'Rewrite the draft to read better on LinkedIn while honoring tone, length, and style.',
      input.editGoal ? 'Satisfy the Edit goal above without adding unsupported facts.' : null,
      'Stay faithful to the FACTS above.'
    ]
      .filter(Boolean)
      .join(' ')
  ]
    .filter((x): x is string => typeof x === 'string')
    .join('\n');
}
