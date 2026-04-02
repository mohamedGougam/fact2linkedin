import { deduplicateFacts } from '@/lib/services/research/deduplicateFacts';
import { extractFactsFromSearchResults } from '@/lib/services/research/extractFactsFromSearch';
import type {
  ResearchProvider,
  ResearchRequest,
  ResearchResult,
  WebFailureKind
} from '@/lib/services/research/types';
import { searchWeb } from '@/lib/services/search/searchClient';
import { isSearchUserError, type SearchUserErrorKind } from '@/lib/services/search/searchUserError';

const ERR_EMPTY_TOPIC = 'Enter a topic to search.';
const ERR_NO_RESULTS =
  'No search results matched this topic. Try different or broader keywords.';
const ERR_NO_FACTS =
  'We found pages, but couldn’t extract clear facts from them. Try a more specific topic.';
const ERR_EXTRACTION =
  'Something went wrong while reading the search results. Please try again.';
const ERR_UNKNOWN =
  'Something went wrong while searching. Please try again in a moment.';

function mapSearchErrorKindToWebFailure(kind: SearchUserErrorKind): WebFailureKind {
  return kind;
}

export const webResearchProvider: ResearchProvider = {
  id: 'web',
  label: 'Web search',

  async fetchFacts(request: ResearchRequest): Promise<ResearchResult> {
    const topic = request.topic.trim();
    if (!topic) {
      return { ok: false, error: ERR_EMPTY_TOPIC, status: 400 };
    }

    try {
      const hits = await searchWeb(topic);
      if (hits.length === 0) {
        return {
          ok: false,
          error: ERR_NO_RESULTS,
          status: 502,
          webFailureKind: 'empty_results'
        };
      }

      let rawFacts;
      try {
        rawFacts = extractFactsFromSearchResults(hits, {
          maxTotalFacts: 9,
          maxPerResult: 2
        });
      } catch {
        return {
          ok: false,
          error: ERR_EXTRACTION,
          status: 502,
          webFailureKind: 'extraction_failed'
        };
      }

      const facts = deduplicateFacts(rawFacts);
      if (facts.length === 0) {
        return {
          ok: false,
          error: ERR_NO_FACTS,
          status: 502,
          webFailureKind: 'no_usable_facts'
        };
      }

      return { ok: true, facts, researchModeUsed: 'web' };
    } catch (e) {
      if (isSearchUserError(e)) {
        return {
          ok: false,
          error: e.message,
          status: 502,
          webFailureKind: mapSearchErrorKindToWebFailure(e.kind)
        };
      }
      return {
        ok: false,
        error: ERR_UNKNOWN,
        status: 502,
        webFailureKind: 'unknown'
      };
    }
  }
};
