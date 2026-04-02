import { appConfig } from '@/lib/config';

type OpenAiChatResponse = {
  choices?: Array<{ message?: { content?: string } }>;
  error?: { message?: string };
};

export type SuggestTopicsAiResult =
  | { ok: true; topics: string[] }
  | { ok: false; error: string };

function validateTopics(raw: string | undefined, count: number): string[] | null {
  if (!raw) return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;

  let parsed: unknown;
  try {
    parsed = JSON.parse(trimmed);
  } catch {
    return null;
  }

  if (!Array.isArray(parsed)) return null;
  const out: string[] = [];
  const seen = new Set<string>();
  for (const item of parsed) {
    if (typeof item !== 'string') continue;
    const t = item.trim().replace(/\s+/g, ' ');
    if (!t) continue;
    if (t.length > 120) continue;
    const key = t.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(t);
  }

  if (out.length < Math.min(3, count)) return null;
  return out.slice(0, count);
}

function systemPrompt(): string {
  return [
    'You are a LinkedIn content strategist.',
    'You suggest actionable, specific post topics (not full posts).',
    'Do not invent facts or make claims; these are just topic ideas.',
    'Return JSON only: an array of strings. No markdown, no extra keys.'
  ].join(' ');
}

function userPrompt(input: {
  currentTopic: string;
  researchMode: 'mock' | 'web';
  recentTopics: string[];
  categories: string[];
  count: number;
}): string {
  const recent = input.recentTopics.slice(0, 8).map((t) => `- ${t}`).join('\n');
  const cats = input.categories.map((c) => `- ${c}`).join('\n');
  return [
    'Suggest topic ideas for LinkedIn posts.',
    '',
    `Mode: ${input.researchMode}`,
    input.currentTopic.trim() ? `Current typed topic: ${input.currentTopic.trim()}` : 'Current typed topic: (empty)',
    '',
    'Recent history topics (if any):',
    recent || '(none)',
    '',
    'Preferred categories:',
    cats || '(none)',
    '',
    `Return exactly ${input.count} topics as a JSON array of strings.`,
    'Each topic should be specific and immediately usable as a LinkedIn post title.',
    'Avoid vague topics like "AI in business" — add an angle, audience, or scenario.'
  ].join('\n');
}

export async function suggestTopicsWithOpenAI(input: {
  currentTopic: string;
  researchMode: 'mock' | 'web';
  recentTopics: string[];
  categories: string[];
  count: number;
}): Promise<SuggestTopicsAiResult> {
  const key = appConfig.openaiApiKey;
  if (!key) return { ok: false, error: 'OpenAI is not configured.' };

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${key}`
    },
    body: JSON.stringify({
      model: appConfig.openaiModel,
      temperature: 0.55,
      max_tokens: 900,
      messages: [
        { role: 'system', content: systemPrompt() },
        { role: 'user', content: userPrompt(input) }
      ]
    })
  });

  const json = (await res.json()) as OpenAiChatResponse;
  if (!res.ok) {
    const msg = json.error?.message ?? res.statusText;
    return { ok: false, error: msg || 'OpenAI request failed.' };
  }

  const content = json.choices?.[0]?.message?.content;
  const validated = validateTopics(content, input.count);
  if (!validated) {
    return { ok: false, error: 'The model returned an invalid topics list.' };
  }

  return { ok: true, topics: validated };
}

