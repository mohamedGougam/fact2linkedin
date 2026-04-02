import { appConfig, isOpenAiConfigured } from '@/lib/config';
import { aiPostProvider } from '@/lib/services/postGeneration/providers/aiPostProvider';
import { templatePostProvider } from '@/lib/services/postGeneration/providers/templatePostProvider';
import type {
  PostGenerationRequest,
  PostGenerationResult
} from '@/lib/services/postGeneration/types';

/**
 * Chooses template vs AI provider. Default: templates only (MVP).
 *
 * - `POST_GENERATION_PROVIDER=template` (or unset) → templates.
 * - `POST_GENERATION_PROVIDER=ai` + `OPENAI_API_KEY` → AI provider (stub until implemented).
 * - `POST_GENERATION_PROVIDER=ai` without a key → **fallback to templates** so local dev keeps working.
 */
export async function runPostGeneration(
  request: PostGenerationRequest
): Promise<PostGenerationResult> {
  const wantAi = appConfig.postGenerationProvider === 'ai';

  const providerResult =
    wantAi && isOpenAiConfigured()
      ? await aiPostProvider.generate(request)
      : await templatePostProvider.generate(request);

  if (!providerResult.ok) {
    return providerResult;
  }

  const single = request.regenerateStyleIndex;
  return {
    ok: true,
    posts: providerResult.posts,
    factsUsed: request.facts,
    postStylesUsed:
      single !== undefined ? [request.postStyles[single]] : request.postStyles,
    ...(single !== undefined ? { regenerateStyleIndex: single } : {})
  };
}
