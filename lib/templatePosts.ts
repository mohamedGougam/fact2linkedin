import type { PostStyle } from '@/lib/postStyle';
import type { PostLength } from '@/lib/post-length';
import type { Tone } from '@/lib/tone';
import { stripHtmlTags } from '@/lib/stripHtml';

/** How many deterministic template rotations exist (no randomness). */
export const TEMPLATE_VARIANT_COUNT = 3;

const STYLE_HEADERS: Record<PostStyle, [string, string, string]> = {
  professional_insight: [
    'Professional insight — Executive snapshot',
    'Professional insight — Brief for leaders',
    'Professional insight — Priority lens'
  ],
  educational: [
    'Educational — Core idea',
    'Educational — Concept in one line',
    'Educational — Lesson headline'
  ],
  bold_thought_leadership: [
    'Thought leadership — Strong stance',
    'Thought leadership — Unfiltered view',
    'Thought leadership — Hot headline'
  ],
  storytelling: [
    'Story — Opening beat',
    'Story — The turn',
    'Story — Takeaway'
  ],
  statistic_led: [
    'By the numbers — Key figure',
    'By the numbers — Trend',
    'By the numbers — Delta'
  ]
};

const STYLE_TAGS: Record<PostStyle, [string, string, string]> = {
  professional_insight: ['#Leadership #Insight', '#Strategy #Brief', '#Outlook #Lens'],
  educational: ['#Learning #Explained', '#TeachInPublic', '#StudyNotes'],
  bold_thought_leadership: [
    '#ThoughtLeadership #Perspective',
    '#BoldTake #Opinion',
    '#Leadership #Debate'
  ],
  storytelling: ['#Story #Lesson', '#Narrative #Growth', '#Journey #Insight'],
  statistic_led: ['#Data #Metrics', '#Evidence #Trends', '#Numbers #Impact']
};

const MEDIUM_LINES: Record<Tone, [string, string, string]> = {
  professional: [
    'Context: This aligns with how leaders are framing priorities this quarter.',
    'Framing: Exec readers want the “so what” before the fine print.',
    'Lens: Tie this fact to a decision your audience is already weighing.'
  ],
  educational: [
    'Teaching note: Use this as a hook if you explain the concept to newcomers.',
    'Pedagogy tip: Pair the fact with one sentence a beginner can repeat.',
    'Clarity check: If a student asked “why care?”, this line answers it.'
  ],
  bold: [
    'Say it louder: If this feels uncomfortable, it is probably worth posting.',
    'Direct take: Name the tradeoff—half-measures read as vague.',
    'Pressure test: Would you still post this if your logo were removed?'
  ],
  conversational: [
    'Friendly aside: This is the kind of thing I’d tell a coworker over coffee.',
    'Human angle: Lead with reaction, then back it with the fact.',
    'Low-key invite: Sound like a person, not a press release.'
  ]
};

const LONG_BLOCKS: Record<Tone, [string, string, string]> = {
  professional: [
    'Elaboration: Tie this back to your team’s goals and cite one concrete example from your work. Keep sentences crisp and outcome-focused.\n\nClosing line: Invite readers to share how they are handling the same theme.',
    'Structure: Open with the implication, then support with the fact. Avoid jargon unless your audience expects it.\n\nClosing line: Offer a single next step a busy reader can take today.',
    'Credibility: Mention constraints you navigated—decision-makers trust specifics.\n\nClosing line: Invite a thoughtful comment from peers in similar roles.'
  ],
  educational: [
    'Teach the step: Name the idea in one sentence, then add a simple analogy anyone can repeat.\n\nClosing line: Ask a question so beginners feel welcome to comment.',
    'Scaffold: Give a mini “before / after” so the fact lands in context.\n\nClosing line: Point to one resource or habit that reinforces the lesson.',
    'Check understanding: Add a one-line misconception this fact clears up.\n\nClosing line: Encourage readers to add their favorite analogy.'
  ],
  bold: [
    'Double down: Name who benefits and who might disagree — clarity beats vague inspiration.\n\nClosing line: Challenge the reader to pick a side (politely) in the comments.',
    'Friction: Acknowledge the objection first, then deliver the fact as your answer.\n\nClosing line: Ask who else sees the same pattern.',
    'Stakes: Why does this matter this week, not someday?\n\nClosing line: Invite pushback—you learn from tension.'
  ],
  conversational: [
    'Keep it human: Share a tiny story or reaction so it feels like a person, not a brochure.\n\nClosing line: End with something easy to reply to.',
    'Rhythm: Short paragraphs. One idea per beat. Let the fact breathe.\n\nClosing line: Drop a “your turn” prompt that fits a busy feed.',
    'Voice: Write like you talk—then trim 10% for polish.\n\nClosing line: Thank people for reading; it builds warmth.'
  ]
};

const STORYTELLING_MEDIUM: [string, string, string] = [
  'Scene-set: one sentence of context, then use the fact as the reveal.',
  'Turn: what changed between before and after this fact?',
  'Close: what should the reader do with this story tomorrow?'
];

const STATS_MEDIUM: [string, string, string] = [
  'Quantify first: lead with the figure, then one line on why it matters to your audience.',
  'Trend read: what direction is the metric moving, and who should care?',
  'Benchmark: compare to a prior period or peer set—then invite a reaction.'
];

const STORYTELLING_LONG: [string, string, string] = [
  'Act I–II: Set stakes in plain language, place the fact where the insight lands, keep names generic if needed.\n\nClosing line: Ask readers for a similar moment from their work.',
  'Pivot: Start with tension, resolve with the fact, add one sentence on implications.\n\nClosing line: What would you do next in this situation?',
  'Resolution: Land the lesson without moralizing—let the fact carry weight.\n\nClosing line: Invite a short story in the comments.'
];

const STATS_LONG: [string, string, string] = [
  'Unpack the number: source, timeframe, and why this benchmark matters now.\n\nClosing line: Ask what decision this statistic should influence.',
  'Context strip: pair the stat with one sentence on methodology or limitation.\n\nClosing line: Should leaders trust this trend—why or why not?',
  'So-what block: translate the figure into a customer or team outcome.\n\nClosing line: Tag someone who needs this data point today.'
];

function normalizeVariant(variantIndex: number): number {
  return (
    ((Math.floor(variantIndex) % TEMPLATE_VARIANT_COUNT) + TEMPLATE_VARIANT_COUNT) %
    TEMPLATE_VARIANT_COUNT
  );
}

function mediumLineForStyle(style: PostStyle, tone: Tone, v: number): string {
  if (style === 'storytelling') return STORYTELLING_MEDIUM[v];
  if (style === 'statistic_led') return STATS_MEDIUM[v];
  return MEDIUM_LINES[tone][v];
}

function longBlockForStyle(style: PostStyle, tone: Tone, v: number): string {
  if (style === 'storytelling') return STORYTELLING_LONG[v];
  if (style === 'statistic_led') return STATS_LONG[v];
  return LONG_BLOCKS[tone][v];
}

/**
 * One draft per selected style. Tone and length shape voice and padding; styles pick headline archetypes.
 */
export function postsFromFactsForStyles(
  facts: string[],
  tone: Tone,
  length: PostLength,
  variantIndex: number,
  styles: PostStyle[]
): string[] {
  const v = normalizeVariant(variantIndex);
  const lines =
    facts.length > 0 ? facts.map((line) => stripHtmlTags(line)) : ['(no facts yet)'];

  let factCursor = 0;
  return styles.map((style) => {
    const header = STYLE_HEADERS[style][v];
    const tagLine = STYLE_TAGS[style][v];
    const mediumLine = mediumLineForStyle(style, tone, v);
    const longBlock = longBlockForStyle(style, tone, v);
    const factLine = lines[factCursor % lines.length];
    factCursor++;
    return formatPost(header, factLine, tagLine, length, mediumLine, longBlock);
  });
}

function formatPost(
  header: string,
  factLine: string,
  tagLine: string,
  length: PostLength,
  mediumLine: string,
  longBlock: string
): string {
  const core = `${header}:\n${factLine}`;

  if (length === 'short') {
    return `${core}\n\n${tagLine}`;
  }

  if (length === 'medium') {
    return `${core}\n\n${mediumLine}\n\n${tagLine}`;
  }

  return `${core}\n\n${longBlock}\n\n${tagLine}`;
}
