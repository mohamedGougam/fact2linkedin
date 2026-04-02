import { appConfig } from '@/lib/config';
import { rewriteSystemPrompt, rewriteUserPrompt } from '@/lib/services/aiPostRewrite/buildRewritePrompt';
import { validateRewrittenPost } from '@/lib/services/aiPostRewrite/validateRewrittenPost';
import type { PostStyle } from '@/lib/postStyle';
import type { PostLength } from '@/lib/post-length';
import type { Fact } from '@/lib/types/fact';
import type { Tone } from '@/lib/tone';

type OpenAiChatResponse = {
  choices?: Array<{ message?: { content?: string } }>;
  error?: { message?: string };
};

export type RewriteWithAiResult =
  | { ok: true; post: string }
  | { ok: false; error: string };

export async function rewritePostWithOpenAI(input: {
  facts: Fact[];
  tone: Tone;
  length: PostLength;
  postStyle: PostStyle;
  currentPost: string;
  editGoal?: string;
}): Promise<RewriteWithAiResult> {
  const key = appConfig.openaiApiKey;
  if (!key) {
    return { ok: false, error: 'OpenAI is not configured.' };
  }

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${key}`
    },
    body: JSON.stringify({
      model: appConfig.openaiModel,
      temperature: 0.35,
      max_tokens: 2800,
      messages: [
        { role: 'system', content: rewriteSystemPrompt() },
        {
          role: 'user',
          content: rewriteUserPrompt({
            facts: input.facts,
            tone: input.tone,
            length: input.length,
            postStyle: input.postStyle,
            currentPost: input.currentPost,
            editGoal: input.editGoal
          })
        }
      ]
    })
  });

  const raw = (await res.json()) as OpenAiChatResponse;

  if (!res.ok) {
    const msg = raw.error?.message ?? res.statusText;
    return { ok: false, error: msg || 'OpenAI request failed.' };
  }

  const content = raw.choices?.[0]?.message?.content;
  const validated = validateRewrittenPost(content);
  if (validated === null) {
    return {
      ok: false,
      error: 'The model returned text we could not use. Try again, or keep your original draft.'
    };
  }

  return { ok: true, post: validated };
}
