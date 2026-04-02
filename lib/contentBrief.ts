import type { Fact } from '@/lib/types/fact';
import type { Tone } from '@/lib/tone';
import type { PostLength } from '@/lib/post-length';
import { POST_STYLE_LABELS, type PostStyle } from '@/lib/postStyle';

function capLines(lines: string[], max: number): string[] {
  return lines.filter(Boolean).slice(0, max);
}

function audienceAngleFromTone(tone: Tone): string {
  switch (tone) {
    case 'professional':
      return 'Operators and decision-makers who care about measurable outcomes.';
    case 'educational':
      return 'People new to the topic who want a clear, practical explanation.';
    case 'bold':
      return 'Leaders who enjoy a strong point-of-view (but still want substance).';
    case 'conversational':
      return 'Peers who want relatable lessons and a discussion starter.';
    default:
      return 'Busy professionals who want a clear takeaway.';
  }
}

function directionFromLength(length: PostLength): string {
  switch (length) {
    case 'short':
      return 'Keep it tight: one hook, 2–3 key points, one closing line.';
    case 'medium':
      return 'Use a simple structure: hook → 3–5 bullets → short conclusion.';
    case 'long':
      return 'Go deeper: add context, nuance, and a practical framework, while staying readable.';
    default:
      return 'Use a clear structure and keep it readable.';
  }
}

export function generateContentBriefDeterministic(input: {
  topic: string;
  facts: Fact[];
  tone: Tone;
  length: PostLength;
  postStyles: PostStyle[];
}): string {
  const topic = input.topic.trim() || 'Untitled topic';
  const factTexts = input.facts.map((f) => f.text.trim()).filter(Boolean);
  const topFacts = capLines(factTexts, 6);

  const takeaways = capLines(
    topFacts.map((t) => `- ${t}`),
    5
  );

  const styles =
    input.postStyles.length > 0
      ? input.postStyles.map((s) => POST_STYLE_LABELS[s]).join(', ')
      : 'any';

  return [
    'CONTENT BRIEF',
    '',
    'Topic summary',
    `- ${topic}`,
    topFacts.length > 0 ? `- Based on ${Math.min(input.facts.length, 24)} selected fact(s).` : '- No facts selected yet.',
    '',
    'Key takeaways',
    ...(takeaways.length > 0 ? takeaways : ['- Pick at least 1 fact to generate takeaways.']),
    '',
    'Possible audience angle',
    `- ${audienceAngleFromTone(input.tone)}`,
    '',
    'Suggested post direction',
    `- ${directionFromLength(input.length)}`,
    `- Match style(s): ${styles}.`,
    '- Don’t overclaim: stay inside the selected facts, and phrase uncertainty clearly.',
    ''
  ].join('\n');
}

