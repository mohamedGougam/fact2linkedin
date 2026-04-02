import { appConfig, isSearchConfigured } from '@/lib/config';
import { mockResearchProvider } from '@/lib/services/research/providers/mockResearchProvider';
import { webResearchProvider } from '@/lib/services/research/providers/webResearchProvider';
import type { ResearchRequest, ResearchResult, WebFailureKind } from '@/lib/services/research/types';

const INFO_WEB_NOT_CONFIGURED =
  'Live web search isn’t set up on the server yet (search URL and API key). Showing sample facts instead.';

const INFO_WEB_FAILED =
  'Live web search didn’t return usable facts. Showing sample facts instead.';

function fallbackInfoForWebFailure(kind?: WebFailureKind): string {
  switch (kind) {
    case 'empty_results':
      return 'No web results matched your topic. Showing sample facts instead.';
    case 'no_usable_facts':
      return 'Web pages didn’t contain text we could turn into facts. Showing sample facts instead.';
    case 'extraction_failed':
      return 'We couldn’t process the search results safely. Showing sample facts instead.';
    case 'network':
      return 'We couldn’t reach the search service (network issue). Showing sample facts instead.';
    case 'timeout':
      return 'The search took too long and was stopped. Showing sample facts instead.';
    case 'http':
      return 'The search service had a temporary problem. Showing sample facts instead.';
    case 'parse':
      return 'The search response couldn’t be read. Showing sample facts instead.';
    case 'auth':
      return 'Live search isn’t configured correctly, or access was denied. Showing sample facts instead.';
    case 'unknown':
      return 'Live web search hit an unexpected problem. Showing sample facts instead.';
    default:
      return INFO_WEB_FAILED;
  }
}

/**
 * Chooses research source from UI (`researchMode`) or env (`RESEARCH_PROVIDER`) when mode is omitted.
 */
export async function runResearch(request: ResearchRequest): Promise<ResearchResult> {
  const mode = request.researchMode;

  if (mode === 'mock') {
    return mockResearchProvider.fetchFacts(request);
  }

  if (mode === 'web') {
    if (!isSearchConfigured()) {
      const r = await mockResearchProvider.fetchFacts(request);
      if (!r.ok) return r;
      return {
        ok: true,
        facts: r.facts,
        researchModeUsed: 'mock',
        info: INFO_WEB_NOT_CONFIGURED
      };
    }
    const webResult = await webResearchProvider.fetchFacts(request);
    if (webResult.ok) {
      return { ok: true, facts: webResult.facts, researchModeUsed: 'web' };
    }
    const r = await mockResearchProvider.fetchFacts(request);
    if (!r.ok) return r;
    return {
      ok: true,
      facts: r.facts,
      researchModeUsed: 'mock',
      info: fallbackInfoForWebFailure(webResult.webFailureKind)
    };
  }

  // Legacy: no `researchMode` in body — follow `RESEARCH_PROVIDER` env.
  const wantWeb = appConfig.researchProvider === 'web';
  if (!wantWeb) {
    return mockResearchProvider.fetchFacts(request);
  }

  if (!isSearchConfigured()) {
    return mockResearchProvider.fetchFacts(request);
  }

  const webResult = await webResearchProvider.fetchFacts(request);
  if (webResult.ok) {
    return { ok: true, facts: webResult.facts, researchModeUsed: 'web' };
  }

  return mockResearchProvider.fetchFacts(request);
}
