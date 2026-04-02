/** Voice for template-based drafts (still deterministic, not AI). */
export type Tone = 'professional' | 'educational' | 'bold' | 'conversational';

export const TONES: Tone[] = [
  'professional',
  'educational',
  'bold',
  'conversational'
];

export function isTone(value: unknown): value is Tone {
  return typeof value === 'string' && (TONES as string[]).includes(value);
}
