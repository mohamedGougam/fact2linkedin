import { confidenceFromFact } from '@/lib/services/research/factConfidence';

import { deduplicateFacts } from '@/lib/services/research/deduplicateFacts';

import { classifySourceCategory } from '@/lib/services/research/sourceRules';

import type { Fact } from '@/lib/types/fact';

import type { ResearchProvider, ResearchRequest, ResearchResult } from '@/lib/services/research/types';



/**

 * Offline, deterministic facts — same behavior the app had before providers existed.

 */

export const mockResearchProvider: ResearchProvider = {

  id: 'mock',

  label: 'Mock research (local templates)',



  async fetchFacts(request: ResearchRequest): Promise<ResearchResult> {

    const facts = deduplicateFacts(buildMockFactsForTopic(request.topic));

    return { ok: true, facts, researchModeUsed: 'mock' };

  }

};



function djb2Hex(s: string): string {

  let hash = 5381;

  for (let i = 0; i < s.length; i++) {

    hash = (hash * 33) ^ s.charCodeAt(i);

  }

  return (hash >>> 0).toString(16).padStart(8, '0');

}



function mockFactId(topic: string, slot: number): string {

  return `mock-${djb2Hex(`${topic}|${slot}`)}`;

}



function buildMockFactsForTopic(topic: string): Fact[] {

  const label = topic.trim() || 'your topic';

  const u1 = 'https://example.com/mock/sources/maritime-brief-1';

  const u2 = 'https://example.com/mock/sources/port-digest-2';

  const u3 = 'https://example.com/mock/sources/internal-3';



  const rows: Fact[] = [

    {

      id: mockFactId(label, 1),

      text: `Mock fact 1 about “${label}”.`,

      sourceName: 'Maritime Brief (mock)',

      sourceType: 'article',

      sourceUrl: u1,

      sourceCategory: classifySourceCategory(undefined, u1),

      confidence: 0,

      verificationStatus: 'mock',

      searchResultIndex: 0

    },

    {

      id: mockFactId(label, 2),

      text: `Mock fact 2 about “${label}”.`,

      sourceName: 'Port Operations Digest',

      sourceType: 'report',

      sourceUrl: u2,

      sourceCategory: classifySourceCategory(undefined, u2),

      confidence: 0,

      verificationStatus: 'mock',

      searchResultIndex: 0

    },

    {

      id: mockFactId(label, 3),

      text: `Mock fact 3 about “${label}”.`,

      sourceName: 'Internal notes (mock)',

      sourceType: 'mock',

      sourceUrl: u3,

      sourceCategory: classifySourceCategory(undefined, u3),

      confidence: 0,

      verificationStatus: 'mock',

      searchResultIndex: 0

    }

  ];



  return rows.map((f) => ({ ...f, confidence: confidenceFromFact(f) }));

}


