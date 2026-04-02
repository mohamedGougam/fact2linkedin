import { runResearch } from '@/lib/services/research/researchOrchestrator';
import type { Fact } from '@/lib/types/fact';

/**
 * Research service: validate HTTP body, then delegate to the active research provider.
 *
 * Provider details live under `lib/services/research/` — this file stays a thin façade
 * for the API route (same public function name as before).
 */

export type ResearchFactsOutcome =
  | { ok: true; facts: Fact[]; researchModeUsed: 'mock' | 'web'; info?: string }
  | { ok: false; error: string; status: number };

/**
 * Validates POST body and returns facts from the orchestrator.
 * Optional `researchMode`: `mock` | `web` (otherwise env `RESEARCH_PROVIDER` is used).
 */
export async function getFactsForTopic(body: unknown): Promise<ResearchFactsOutcome> {
  if (body === null || typeof body !== 'object' || Array.isArray(body)) {
    return {
      ok: false,
      error: 'Send JSON with a topic field.',
      status: 400
    };
  }

  const topic = (body as { topic?: unknown }).topic;
  const topicText = typeof topic === 'string' ? topic : '';

  const rawMode = (body as { researchMode?: unknown }).researchMode;
  let researchMode: 'mock' | 'web' | undefined;
  if (rawMode === undefined || rawMode === null) {
    researchMode = undefined;
  } else if (rawMode === 'mock' || rawMode === 'web') {
    researchMode = rawMode;
  } else {
    return {
      ok: false,
      error: 'researchMode must be "mock" or "web" when provided.',
      status: 400
    };
  }

  const result = await runResearch({ topic: topicText, researchMode });

  if (!result.ok) {
    return {
      ok: false,
      error: result.error,
      status: result.status ?? 400
    };
  }

  return {
    ok: true,
    facts: result.facts,
    researchModeUsed: result.researchModeUsed,
    ...(result.info ? { info: result.info } : {})
  };
}
