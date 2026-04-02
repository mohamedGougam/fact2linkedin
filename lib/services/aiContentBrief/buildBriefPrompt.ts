import type { Fact } from '@/lib/types/fact';
import type { Tone } from '@/lib/tone';
import type { PostLength } from '@/lib/post-length';
import { POST_STYLE_LABELS, type PostStyle } from '@/lib/postStyle';

export function briefSystemPrompt(): string {
  return [
    'You are a concise content strategist.',
    'You write a short content brief (not a full KAWN Post).',
    'You must NOT invent factual claims beyond the FACTS list.',
    'If the topic is broad, keep the brief general rather than guessing details.',
    'Output plain text only, with clear section headings.',
    'Do not output markdown code fences or JSON.'
  ].join(' ');
}

export function briefUserPrompt(input: {
  topic: string;
  facts: Fact[];
  tone: Tone;
  length: PostLength;
  postStyles: PostStyle[];
}): string {
  const topic = input.topic.trim() || '(no topic provided)';
  const factLines = input.facts.map((f, i) => `${i + 1}. ${f.text.trim()}`).join('\n');
  const styles =
    input.postStyles.length > 0
      ? input.postStyles.map((s) => POST_STYLE_LABELS[s]).join(', ')
      : '(unspecified)';

  return [
    'Create a content brief with these sections:',
    '- Topic summary (2–3 bullets)',
    '- Key takeaways (3–5 bullets)',
    '- Possible audience angle (1–2 bullets)',
    '- Suggested post direction (2–4 bullets)',
    '',
    `Topic: ${topic}`,
    `Tone: ${input.tone}`,
    `Target post length: ${input.length}`,
    `Selected post styles: ${styles}`,
    '',
    'FACTS (the only claims you may rely on):',
    factLines || '(none — keep it very high-level and do not add claims.)'
  ].join('\n');
}

