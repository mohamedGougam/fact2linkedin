export type WorkflowStep = 1 | 2 | 3 | 4 | 5;

/**
 * Derives the active workflow step from existing UI state (single page, no wizard store).
 */
export function getWorkflowStep(params: {
  factsCount: number;
  factsLoading: boolean;
  postsCount: number;
  postsLoading: boolean;
}): WorkflowStep {
  const { factsCount, factsLoading, postsCount, postsLoading } = params;
  if (factsLoading) return 2;
  if (factsCount === 0) return 1;
  if (postsLoading) return 4;
  if (postsCount === 0) return 3;
  return 5;
}
