import { appConfig } from '@/lib/config';
import type {
  PostGenerationProvider,
  PostGenerationProviderResult,
  PostGenerationRequest
} from '@/lib/services/postGeneration/types';

/**
 * Future home for OpenAI (or similar) calls.
 * Stays inactive until you implement `generate` and wire env vars.
 * When implemented, pass only `request.facts` (selected claims + metadata) into the model context.
 */
export const aiPostProvider: PostGenerationProvider = {
  id: 'ai',
  label: 'AI-assisted drafts (placeholder)',

  async generate(request: PostGenerationRequest): Promise<PostGenerationProviderResult> {
    void request.facts;
    void request.postStyles;
    void request.regenerateStyleIndex;

    if (!appConfig.openaiApiKey) {
      return {
        ok: false,
        error: 'OPENAI_API_KEY is not configured.',
        status: 503
      };
    }

    return {
      ok: false,
      error:
        'AI-assisted generation is not implemented yet. Use template mode (default) or finish this provider.',
      status: 501
    };
  }
};
