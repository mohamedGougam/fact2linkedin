import { postsFromFactsForStyles } from '@/lib/templatePosts';
import type {
  PostGenerationProvider,
  PostGenerationProviderResult,
  PostGenerationRequest
} from '@/lib/services/postGeneration/types';

/**
 * Default provider: same deterministic templates as always (no API calls).
 * Uses only the text of each fact in `request.facts`, in order — no other claims are introduced.
 */
export const templatePostProvider: PostGenerationProvider = {
  id: 'template',
  label: 'Template-based drafts',

  async generate(request: PostGenerationRequest): Promise<PostGenerationProviderResult> {
    const factTexts = request.facts.map((f) => f.text);
    const styles =
      request.regenerateStyleIndex !== undefined
        ? [request.postStyles[request.regenerateStyleIndex]]
        : request.postStyles;
    const posts = postsFromFactsForStyles(
      factTexts,
      request.tone,
      request.length,
      request.variant,
      styles
    );
    return { ok: true, posts };
  }
};
