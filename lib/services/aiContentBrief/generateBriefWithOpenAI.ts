import { appConfig } from '@/lib/config';
import { briefSystemPrompt, briefUserPrompt } from '@/lib/services/aiContentBrief/buildBriefPrompt';
import { validateBrief } from '@/lib/services/aiContentBrief/validateBrief';
import type { Fact } from '@/lib/types/fact';
import type { Tone } from '@/lib/tone';
import type { PostLength } from '@/lib/post-length';
import type { PostStyle } from '@/lib/postStyle';

type OpenAiChatResponse = {
  choices?: Array<{ message?: { content?: string } }>;
  error?: { message?: string };
};

export type BriefWithAiResult =
  | { ok: true; brief: string }
  | { ok: false; error: string };

export async function generateBriefWithOpenAI(input: {
  topic: string;
  facts: Fact[];
  tone: Tone;
  length: PostLength;
  postStyles: PostStyle[];
}): Promise<BriefWithAiResult> {
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
      temperature: 0.45,
      max_tokens: 1200,
      messages: [
        { role: 'system', content: briefSystemPrompt() },
        { role: 'user', content: briefUserPrompt(input) }
      ]
    })
  });

  const json = (await res.json()) as OpenAiChatResponse;
  if (!res.ok) {
    const msg = json.error?.message ?? res.statusText;
    return { ok: false, error: msg || 'OpenAI request failed.' };
  }

  const content = json.choices?.[0]?.message?.content;
  const validated = validateBrief(content);
  if (!validated) {
    return { ok: false, error: 'The model returned a brief we could not use.' };
  }

  return { ok: true, brief: validated };
}

