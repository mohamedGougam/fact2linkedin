/**
 * Server-side configuration from environment variables.
 *
 * Do not import this file from Client Components (`'use client'`) — secrets must stay
 * on the server. API routes and `lib/services/*` are safe.
 *
 * Missing vars are treated as "not configured" so template/mock mode works with no `.env` file.
 */

function readOptional(key: string): string | undefined {
  const v = process.env[key];
  if (v === undefined || String(v).trim() === '') {
    return undefined;
  }
  return v;
}

function researchProviderMode(): 'mock' | 'web' {
  const raw = readOptional('RESEARCH_PROVIDER')?.toLowerCase() ?? 'mock';
  if (raw === 'web') return 'web';
  return 'mock';
}

/** template = deterministic (default). ai = use AI provider when OPENAI_API_KEY is set. */
function postGenerationMode(): 'template' | 'ai' {
  const raw = readOptional('POST_GENERATION_PROVIDER')?.toLowerCase() ?? 'template';
  if (raw === 'ai') return 'ai';
  return 'template';
}

/**
 * Resolved settings for the running process. Safe defaults when env is empty.
 */
export const appConfig = {
  researchProvider: researchProviderMode(),

  postGenerationProvider: postGenerationMode(),

  /** Set when you wire OpenAI (post rewrite, future full AI generation). */
  openaiApiKey: readOptional('OPENAI_API_KEY'),

  /** Chat model for rewrite (`gpt-4o-mini` if unset). */
  openaiModel: readOptional('OPENAI_MODEL') ?? 'gpt-4o-mini',

  /** Web search (e.g. Brave Search API). Both required for live web research. */
  searchApiKey: readOptional('SEARCH_API_KEY'),
  searchApiUrl: readOptional('SEARCH_API_URL')
} as const;

export function isOpenAiConfigured(): boolean {
  return Boolean(appConfig.openaiApiKey);
}

/** True when both search URL and key are set (required for web research mode). */
export function isSearchConfigured(): boolean {
  return Boolean(appConfig.searchApiKey && appConfig.searchApiUrl);
}
