export type TopicSuggestionCategory =
  | 'industry_trend'
  | 'educational_insight'
  | 'myth_vs_reality'
  | 'practical_lessons'
  | 'regulation_update'
  | 'leadership_angle';

export const TOPIC_SUGGESTION_CATEGORIES: ReadonlyArray<{
  id: TopicSuggestionCategory;
  label: string;
}> = [
  { id: 'industry_trend', label: 'Industry trend' },
  { id: 'educational_insight', label: 'Educational insight' },
  { id: 'myth_vs_reality', label: 'Myth vs reality' },
  { id: 'practical_lessons', label: 'Practical lessons' },
  { id: 'regulation_update', label: 'Regulation/update' },
  { id: 'leadership_angle', label: 'Leadership angle' }
];

function uniqKeepOrder(items: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const x of items) {
    const t = x.trim();
    if (!t) continue;
    const key = t.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(t);
  }
  return out;
}

function pickSeedPhrase(input: {
  currentTopic: string;
  recentTopics: string[];
}): string {
  const typed = input.currentTopic.trim();
  if (typed) return typed;
  const recent = input.recentTopics.map((t) => t.trim()).filter(Boolean);
  if (recent.length > 0) return recent[0];
  return 'your industry';
}

function categoryTemplates(category: TopicSuggestionCategory, seed: string): string[] {
  switch (category) {
    case 'industry_trend':
      return [
        `What’s changing in ${seed} in 2026 (and what to do about it)`,
        `The 3 biggest shifts I’m watching in ${seed} this quarter`,
        `A simple framework to evaluate new trends in ${seed} (signal vs noise)`
      ];
    case 'educational_insight':
      return [
        `${seed}: a beginner-friendly explainer (with one practical example)`,
        `The “one concept” that helped me understand ${seed} faster`,
        `If you’re new to ${seed}, start with these 5 building blocks`
      ];
    case 'myth_vs_reality':
      return [
        `Myth vs reality: what people get wrong about ${seed}`,
        `3 common misconceptions about ${seed} (and the nuance that matters)`,
        `Hot take (with receipts): ${seed} isn’t what most people think`
      ];
    case 'practical_lessons':
      return [
        `Practical lessons from implementing ${seed}: what worked, what didn’t`,
        `A checklist I use for better outcomes in ${seed}`,
        `The playbook: how to get quick wins in ${seed} in 30 days`
      ];
    case 'regulation_update':
      return [
        `Regulation update: what the latest changes could mean for ${seed}`,
        `Compliance without chaos: how I think about new rules in ${seed}`,
        `A non-lawyer summary: recent updates affecting ${seed} (and practical next steps)`
      ];
    case 'leadership_angle':
      return [
        `Leadership lesson: how to lead teams through change in ${seed}`,
        `The leadership mistake I see in ${seed} transformations (and a better approach)`,
        `How to align stakeholders on ${seed} without endless meetings`
      ];
  }
}

export function suggestTopicsDeterministic(input: {
  currentTopic: string;
  researchMode: 'mock' | 'web';
  recentTopics: string[];
  categories?: TopicSuggestionCategory[];
  count?: number;
}): string[] {
  const seed = pickSeedPhrase({
    currentTopic: input.currentTopic,
    recentTopics: input.recentTopics
  });

  const chosenCats =
    input.categories && input.categories.length > 0
      ? input.categories
      : (TOPIC_SUGGESTION_CATEGORIES.map((c) => c.id) as TopicSuggestionCategory[]);

  const lines: string[] = [];
  for (const cat of chosenCats) {
    lines.push(...categoryTemplates(cat, seed));
  }

  // Small mode hint: in mock mode, nudge toward evergreen posts.
  const modeHint =
    input.researchMode === 'mock'
      ? [`Evergreen: the fundamentals of ${seed} that most teams skip`]
      : [];

  const merged = uniqKeepOrder([...modeHint, ...lines]);
  const limit = Math.max(3, Math.min(12, input.count ?? 8));
  return merged.slice(0, limit);
}

