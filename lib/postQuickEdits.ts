/**
 * Deterministic “quick polish” transforms for KAWN Post drafts.
 * No external NLP libraries — string splits, regex, and small template phrases.
 *
 * When AI post generation is fully enabled server-side, you can swap the call site
 * to an API route that uses the same action ids but runs a model instead.
 */

export type PostQuickEditAction =
  | 'shorter'
  | 'executive'
  | 'engaging'
  | 'remove_hashtags'
  | 'add_cta';

/** UI order and labels (single source of truth). */
export const POST_QUICK_EDIT_ACTIONS: ReadonlyArray<{
  id: PostQuickEditAction;
  label: string;
}> = [
  { id: 'shorter', label: 'Make shorter' },
  { id: 'executive', label: 'Make more executive' },
  { id: 'engaging', label: 'Make more engaging' },
  { id: 'remove_hashtags', label: 'Remove hashtags' },
  { id: 'add_cta', label: 'Add CTA' }
];

function splitSentences(text: string): string[] {
  const t = text.trim();
  if (!t) return [];
  // Split after . ! ? when followed by space or end (handles most short-form social prose).
  const raw = t.split(/(?<=[.!?])\s+/);
  return raw.map((s) => s.trim()).filter((s) => s.length > 0);
}

function joinSentences(sentences: string[]): string {
  return sentences.join(' ');
}

/** Keep roughly the first half of sentences; if one sentence, trim filler words a bit. */
function makeShorter(text: string): string {
  const sentences = splitSentences(text);
  if (sentences.length === 0) return text;
  if (sentences.length === 1) {
    let s = sentences[0];
    const fillers = /\b(really|very|just|basically|actually|quite)\b/gi;
    s = s.replace(fillers, '').replace(/\s{2,}/g, ' ').trim();
    return s;
  }
  const keep = Math.max(1, Math.ceil(sentences.length / 2));
  return joinSentences(sentences.slice(0, keep));
}

const EXEC_PREFIX = 'Executive summary:\n\n';

function makeExecutive(text: string): string {
  const t = text.trim();
  if (!t) return t;
  if (t.startsWith('Executive summary:')) return t;
  return EXEC_PREFIX + t;
}

const ENGAGING_SUFFIX =
  "\n\nWhat's your take—agree, disagree, or something in between? Reply and let's discuss.";

function makeEngaging(text: string): string {
  const t = text.trim();
  if (!t) return t;
  if (t.includes("Reply and let's discuss")) return t;
  return t + ENGAGING_SUFFIX;
}

/** Remove #hashtag tokens (letters, numbers, underscore). */
function removeHashtags(text: string): string {
  return text
    .replace(/#[\w\u00C0-\u024F]+/g, '')
    .replace(/[ \t]{2,}/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

const CTA_BLOCK =
  '\n\n— If this was useful, repost it or tag someone who should see it.';

function addCta(text: string): string {
  const t = text.trim();
  if (!t) return t;
  if (t.includes('repost it or tag someone')) return t;
  return t + CTA_BLOCK;
}

/**
 * Apply one quick edit. Input is treated as plain text (strip HTML in the UI before calling).
 */
export function applyPostQuickEdit(text: string, action: PostQuickEditAction): string {
  switch (action) {
    case 'shorter':
      return makeShorter(text);
    case 'executive':
      return makeExecutive(text);
    case 'engaging':
      return makeEngaging(text);
    case 'remove_hashtags':
      return removeHashtags(text);
    case 'add_cta':
      return addCta(text);
  }
}
