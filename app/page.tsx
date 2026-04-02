'use client';

/** Home: research → sources → facts → posts → history. */

import { useEffect, useMemo, useRef, useState } from 'react';
import { DraftPackageSummary } from '@/components/DraftPackageSummary';
import { DraftToPublishPackage } from '@/components/DraftToPublishPackage';
import { ContentBriefPanel } from '@/components/ContentBriefPanel';
import { CompareDraftsPanel } from '@/components/CompareDraftsPanel';
import { ExportPosts } from '@/components/ExportPosts';
import { FactsList } from '@/components/FactsList';
import { HistoryPanel } from '@/components/HistoryPanel';
import { LengthSelect } from '@/components/LengthSelect';
import { PostStyleSelect } from '@/components/PostStyleSelect';
import { PageSection } from '@/components/PageSection';
import { PostsList } from '@/components/PostsList';
import { ToneSelect } from '@/components/ToneSelect';
import type { ResearchModeChoice } from '@/components/ResearchModeSelect';
import { SourceReviewSection } from '@/components/SourceReviewSection';
import { TopicForm } from '@/components/TopicForm';
import { AutomationCandidateIndicator } from '@/components/AutomationCandidateIndicator';
import { WatchlistPanel } from '@/components/WatchlistPanel';
import { WarningsPanel } from '@/components/WarningsPanel';
import { WorkflowIndicator } from '@/components/WorkflowIndicator';
import { POST_STYLES, type PostStyle } from '@/lib/postStyle';
import { TEMPLATE_VARIANT_COUNT } from '@/lib/templatePosts';
import {
  loadAutomationCandidates,
  removeWatchlistAutomationFlag,
  setSettingsProfileAutomationCandidate,
  toggleRunAutomationCandidate,
  toggleWatchlistAutomationCandidate,
  type AutomationCandidatesState
} from '@/lib/automationCandidatesStorage';
import {
  buildSessionWorkflowConfig,
  pickSessionDefaults
} from '@/lib/workflowAutomationConfig';
import { selectionHighConfidenceOnly } from '@/lib/factSelection';
import { buildSessionContentRunReport, isSameFact } from '@/lib/contentRunReport';
import { appendRun, loadRuns, type GenerationRun } from '@/lib/historyStorage';
import {
  filterFactsForGeneration,
  packageHistoryRun,
  runGeneratePostsPhase,
  runRegenerateSinglePostPhase,
  runResearchPhase
} from '@/lib/workflows/runContentDraftWorkflow';
import { deriveSessionWarningsWithExportIssues } from '@/lib/sessionWarnings';
import { getWorkflowStep } from '@/lib/workflowStep';
import type { PostLength } from '@/lib/post-length';
import type {
  ContentBriefApiResponse,
  RewritePostApiResponse,
  TopicSuggestionsApiResponse
} from '@/lib/types/api';
import type { Fact } from '@/lib/types/fact';
import type { Tone } from '@/lib/tone';
import {
  suggestTopicsDeterministic,
  TOPIC_SUGGESTION_CATEGORIES
} from '@/lib/topicSuggestions';
import { generateContentBriefDeterministic } from '@/lib/contentBrief';
import {
  clearStyleMemory,
  DEFAULT_STYLE_MEMORY,
  loadStyleMemory,
  saveStyleMemory
} from '@/lib/styleMemory';
import {
  addToWatchlist,
  loadWatchlist,
  removeFromWatchlist,
  updateWatchlistRecurring,
  type WatchlistItem,
  type WatchlistRecurringRunConfig
} from '@/lib/watchlistStorage';

export default function HomePage() {
  const initialPrefsRef = useRef(loadStyleMemory());
  const [topic, setTopic] = useState('');
  const [facts, setFacts] = useState<Fact[]>([]);
  /** Parallel to facts[i]: whether this fact is included when generating posts. */
  const [selected, setSelected] = useState<boolean[]>([]);
  /** Parallel to facts[i]: pinned facts sort to the top of the list (display only). */
  const [pinned, setPinned] = useState<boolean[]>([]);
  const [tone, setTone] = useState<Tone>(initialPrefsRef.current.preferredTone);
  const [length, setLength] = useState<PostLength>(initialPrefsRef.current.preferredLength);
  /** Which archetypes to generate (one post per selected style). */
  const [postStyles, setPostStyles] = useState<PostStyle[]>(
    () => [...initialPrefsRef.current.preferredPostStyles]
  );
  /** Which deterministic template rotation was last used (0..TEMPLATE_VARIANT_COUNT-1). */
  const [templateVariant, setTemplateVariant] = useState(0);
  const [posts, setPosts] = useState<string[]>([]);
  /** Per-post snapshot of facts used when that draft was generated (aligned with `posts`). */
  const [postFactsUsed, setPostFactsUsed] = useState<Fact[][]>([]);
  const [factsLoading, setFactsLoading] = useState(false);
  const [postsLoading, setPostsLoading] = useState(false);
  /** Which post index is currently regenerating alone (null = none). */
  const [regeneratingPostIndex, setRegeneratingPostIndex] = useState<number | null>(null);
  /** Which post is running AI improve (null = none). */
  const [aiImprovingPostIndex, setAiImprovingPostIndex] = useState<number | null>(null);
  const [aiImproveErrorIndex, setAiImproveErrorIndex] = useState<number | null>(null);
  const [aiImproveErrorMessage, setAiImproveErrorMessage] = useState<string | null>(null);
  /** Optional: use AI to assist quick polish buttons (falls back to deterministic). */
  const [aiAssistQuickPolish, setAiAssistQuickPolish] = useState(false);
  /** Per-slot template bumps so repeated single regens rotate wording. */
  const [slotRegenBumps, setSlotRegenBumps] = useState<number[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [researchInfo, setResearchInfo] = useState<string | null>(null);
  /** Last successful `/api/facts` pipeline (`null` before first load this session). */
  const [researchPipelineUsed, setResearchPipelineUsed] = useState<'mock' | 'web' | null>(
    null
  );
  const [researchMode, setResearchMode] = useState<ResearchModeChoice>(
    initialPrefsRef.current.preferredResearchMode
  );
  const [historyRuns, setHistoryRuns] = useState<GenerationRun[]>([]);
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [topicSuggestions, setTopicSuggestions] = useState<string[]>([]);
  const [topicSuggestLoading, setTopicSuggestLoading] = useState(false);
  const [topicSuggestError, setTopicSuggestError] = useState<string | null>(null);
  const [topicSuggestUseAi, setTopicSuggestUseAi] = useState(false);
  const [brief, setBrief] = useState<string | null>(null);
  const [briefLoading, setBriefLoading] = useState(false);
  const [briefError, setBriefError] = useState<string | null>(null);
  const [briefUseAi, setBriefUseAi] = useState(false);
  /** Post indices marked for side-by-side compare (2+ shows the panel). */
  const [compareIndices, setCompareIndices] = useState<number[]>([]);
  /** Local flags for future automation (no scheduler). */
  const [automationCandidates, setAutomationCandidates] = useState<AutomationCandidatesState>({
    watchlistIds: [],
    runIds: [],
    settingsProfile: false
  });

  useEffect(() => {
    setHistoryRuns(loadRuns());
    setWatchlist(loadWatchlist());
    setAutomationCandidates(loadAutomationCandidates());
  }, []);

  useEffect(() => {
    setCompareIndices((prev) => prev.filter((i) => i >= 0 && i < posts.length));
  }, [posts.length]);

  useEffect(() => {
    setPostFactsUsed((prev) =>
      prev.length === posts.length ? prev : prev.slice(0, posts.length)
    );
  }, [posts.length]);

  // Persist “style memory” whenever the user changes these settings.
  useEffect(() => {
    saveStyleMemory({
      preferredTone: tone,
      preferredLength: length,
      preferredPostStyles: postStyles,
      preferredResearchMode: researchMode
    });
  }, [tone, length, postStyles, researchMode]);

  function resetPreferences() {
    clearStyleMemory();
    setTone(DEFAULT_STYLE_MEMORY.preferredTone);
    setLength(DEFAULT_STYLE_MEMORY.preferredLength);
    setPostStyles([...DEFAULT_STYLE_MEMORY.preferredPostStyles]);
    setResearchMode(DEFAULT_STYLE_MEMORY.preferredResearchMode);
    setAutomationCandidates(setSettingsProfileAutomationCandidate(false));
  }

  function toggleCompareDraft(index: number, selected: boolean) {
    setCompareIndices((prev) => {
      const next = new Set(prev);
      if (selected) next.add(index);
      else next.delete(index);
      return Array.from(next).sort((a, b) => a - b);
    });
  }

  const busy = factsLoading || postsLoading;
  /** Any per-post async work (template regen or AI improve). */
  const postSlotBusy =
    regeneratingPostIndex !== null || aiImprovingPostIndex !== null;

  async function loadFacts(topicOverride?: string) {
    const effectiveTopic =
      typeof topicOverride === 'string' && topicOverride.trim().length > 0
        ? topicOverride.trim()
        : topic.trim();
    if (effectiveTopic !== topic.trim()) {
      setTopic(effectiveTopic);
    }

    setError(null);
    setResearchInfo(null);
    setResearchPipelineUsed(null);
    setFactsLoading(true);
    try {
      const result = await runResearchPhase({ topic: effectiveTopic, researchMode });

      if (!result.ok) {
        setError(result.error);
        return;
      }

      const nextFacts = result.facts;
      setFacts(nextFacts);
      setSelected(nextFacts.map(() => true));
      setPinned(nextFacts.map(() => false));
      setPosts([]);
      setPostFactsUsed([]);
      setTemplateVariant(0);
      setResearchInfo(result.info);
      setResearchPipelineUsed(result.researchModeUsed);
    } finally {
      setFactsLoading(false);
    }
  }

  function recentHistoryTopics(): string[] {
    return historyRuns
      .map((r) => r.report.topic)
      .map((t) => t.trim())
      .filter(Boolean)
      .slice(0, 8);
  }

  async function suggestTopics() {
    setTopicSuggestError(null);
    setTopicSuggestLoading(true);
    try {
      const recentTopics = recentHistoryTopics();
      const categories = TOPIC_SUGGESTION_CATEGORIES.map((c) => c.label);

      if (topicSuggestUseAi) {
        const res = await fetch('/api/topics/suggest', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            currentTopic: topic,
            researchMode,
            recentTopics,
            categories,
            count: 8
          })
        });
        const json = (await res.json()) as TopicSuggestionsApiResponse;
        if (res.ok && Array.isArray(json.topics) && json.topics.length > 0) {
          setTopicSuggestions(json.topics);
          return;
        }
        // Fall back to deterministic suggestions.
        setTopicSuggestError(
          json.error ?? 'AI suggestions were not available; showing standard suggestions instead.'
        );
      }

      const deterministic = suggestTopicsDeterministic({
        currentTopic: topic,
        researchMode,
        recentTopics,
        count: 8
      });
      setTopicSuggestions(deterministic);
    } finally {
      setTopicSuggestLoading(false);
    }
  }

  async function generateBrief() {
    setBriefError(null);
    setBriefLoading(true);
    try {
      const factsForBrief = selectedFacts;
      const deterministic = generateContentBriefDeterministic({
        topic,
        facts: factsForBrief,
        tone,
        length,
        postStyles
      });

      if (briefUseAi) {
        const res = await fetch('/api/brief', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            topic,
            facts: factsForBrief,
            tone,
            length,
            postStyles
          })
        });
        const json = (await res.json()) as ContentBriefApiResponse;
        if (res.ok && typeof json.brief === 'string' && json.brief.trim().length > 0) {
          setBrief(json.brief);
          return;
        }
        setBriefError(
          json.error ?? 'AI brief was not available; showing the standard brief instead.'
        );
      }

      setBrief(deterministic);
    } finally {
      setBriefLoading(false);
    }
  }

  function addWatchTopic(t: string) {
    setWatchlist(addToWatchlist(t));
  }

  function removeWatchTopic(id: string) {
    setWatchlist(removeFromWatchlist(id));
    setAutomationCandidates(removeWatchlistAutomationFlag(id));
  }

  function updateWatchTopicRecurring(id: string, recurring: WatchlistRecurringRunConfig | undefined) {
    setWatchlist(updateWatchlistRecurring(id, recurring));
  }

  function toggleFact(index: number) {
    setSelected((prev) =>
      prev.map((on, i) => (i === index ? !on : on))
    );
  }

  function togglePin(index: number) {
    setPinned((prev) => prev.map((on, i) => (i === index ? !on : on)));
  }

  function selectAllFacts() {
    setSelected(facts.map(() => true));
  }

  function deselectAllFacts() {
    setSelected(facts.map(() => false));
  }

  function selectHighConfidenceFacts() {
    setSelected(selectionHighConfidenceOnly(facts));
  }

  async function requestPosts(variant: number) {
    const chosen = filterFactsForGeneration(facts, selected);
    if (chosen.length === 0) {
      setError('Select at least one fact before generating posts.');
      return;
    }

    setError(null);
    setPostsLoading(true);
    try {
      const result = await runGeneratePostsPhase({
        facts: chosen,
        tone,
        length,
        variant,
        postStyles
      });

      if (!result.ok) {
        setError(result.error);
        return;
      }

      const nextPosts = result.posts;
      const perSlotFacts = nextPosts.map(() => [...result.factsUsed]);
      setPosts(nextPosts);
      setPostFactsUsed(perSlotFacts);
      setTemplateVariant(variant);
      setSlotRegenBumps(nextPosts.map(() => 0));

      setHistoryRuns(
        appendRun(
          packageHistoryRun({
            topic,
            facts,
            selectedFacts: result.factsUsed,
            posts: nextPosts,
            postFactsUsed: perSlotFacts,
            tone,
            length,
            postStyles,
            researchMode,
            researchPipelineUsed,
            researchInfo,
            templateVariant: variant,
            issues: []
          })
        )
      );
    } finally {
      setPostsLoading(false);
    }
  }

  function generatePosts() {
    void requestPosts(0);
  }

  function regeneratePosts() {
    const next = (templateVariant + 1) % TEMPLATE_VARIANT_COUNT;
    void requestPosts(next);
  }

  async function regenerateSinglePost(styleIndex: number) {
    const chosen = filterFactsForGeneration(facts, selected);
    if (chosen.length === 0 || styleIndex < 0 || styleIndex >= postStyles.length) {
      return;
    }

    setError(null);
    setRegeneratingPostIndex(styleIndex);
    const bump = slotRegenBumps[styleIndex] ?? 0;
    const variant = (templateVariant + bump + 1) % TEMPLATE_VARIANT_COUNT;

    try {
      const result = await runRegenerateSinglePostPhase({
        facts: chosen,
        tone,
        length,
        variant,
        postStyles,
        regenerateStyleIndex: styleIndex
      });

      if (!result.ok) {
        setError(result.error);
        return;
      }

      const idx = result.regenerateStyleIndex;
      const one = result.post;
      setPosts((prev) => {
        if (idx < 0 || idx >= prev.length) return prev;
        const next = [...prev];
        next[idx] = one;
        return next;
      });
      setPostFactsUsed((prev) => {
        const next = [...prev];
        while (next.length <= idx) next.push([]);
        next[idx] = [...chosen];
        return next;
      });
      setSlotRegenBumps((prev) => {
        const n = [...prev];
        while (n.length <= idx) n.push(0);
        n[idx] = bump + 1;
        return n;
      });
    } finally {
      setRegeneratingPostIndex(null);
    }
  }

  async function aiQuickEditPost(
    index: number,
    editAction: 'shorter' | 'executive' | 'engaging' | 'remove_hashtags' | 'add_cta',
    currentText: string
  ): Promise<string> {
    const style = postStyles[index];
    if (!style) {
      throw new Error('Could not determine post style for this card.');
    }

    const res = await fetch('/api/posts/rewrite', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        currentPost: currentText,
        facts: selectedFacts,
        tone,
        length,
        postStyle: style,
        editAction
      })
    });

    const json = (await res.json()) as RewritePostApiResponse;
    if (!res.ok || !json.post) {
      const msg =
        json.error ||
        (res.status === 503
          ? 'AI assist is not available on this server.'
          : 'AI assist failed.');
      throw new Error(msg);
    }

    return json.post;
  }

  async function aiImprovePost(index: number) {
    const chosen = filterFactsForGeneration(facts, selected);
    if (
      chosen.length === 0 ||
      index < 0 ||
      index >= posts.length ||
      index >= postStyles.length
    ) {
      return;
    }

    setAiImproveErrorIndex(null);
    setAiImproveErrorMessage(null);
    setAiImprovingPostIndex(index);

    try {
      const response = await fetch('/api/posts/rewrite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPost: posts[index],
          facts: chosen,
          tone,
          length,
          postStyle: postStyles[index]
        })
      });

      const data = (await response.json()) as RewritePostApiResponse;

      if (!response.ok) {
        setAiImproveErrorMessage(data.error ?? 'Could not improve this post.');
        setAiImproveErrorIndex(index);
        return;
      }

      const next = data.post;
      if (typeof next === 'string' && next.trim().length > 0) {
        updatePost(index, next);
      } else {
        setAiImproveErrorMessage('The server returned an empty result. Your draft is unchanged.');
        setAiImproveErrorIndex(index);
      }
    } catch {
      setAiImproveErrorMessage(
        'Could not reach the server. Is `npm run dev` running?'
      );
      setAiImproveErrorIndex(index);
    } finally {
      setAiImprovingPostIndex(null);
    }
  }

  function updatePost(index: number, nextText: string) {
    setPosts((prev) => {
      const copy = [...prev];
      copy[index] = nextText;
      return copy;
    });
  }

  /** Load the saved snapshot: facts, posts, tone, styles — same as before. */
  function restoreRunFull(run: GenerationRun) {
    const r = run.report;
    setError(null);
    setResearchInfo(r.researchInfo ?? null);
    setResearchPipelineUsed(r.researchPipelineUsed ?? r.researchMode);
    setTopic(r.topic);
    setFacts(r.facts);
    setSelected(r.facts.map((f) => r.selectedFacts.some((s) => isSameFact(f, s))));
    setPinned(r.facts.map(() => false));
    setPosts([...r.posts]);
    setPostFactsUsed(
      r.postFactsUsed &&
        r.postFactsUsed.length === r.posts.length &&
        r.postFactsUsed.every((row) => Array.isArray(row))
        ? r.postFactsUsed.map((row) => [...row])
        : r.posts.map(() => [...r.selectedFacts])
    );
    setTone(r.generationOptions.tone);
    setLength(r.generationOptions.length);
    setPostStyles(
      r.generationOptions.postStyles.length > 0
        ? [...r.generationOptions.postStyles]
        : [...POST_STYLES]
    );
    setResearchMode(r.researchMode);
    setTemplateVariant(r.generationOptions.templateVariant);
    setSlotRegenBumps(r.posts.map(() => 0));
    setRegeneratingPostIndex(null);
    setAiImprovingPostIndex(null);
    setAiImproveErrorIndex(null);
    setAiImproveErrorMessage(null);
    setCompareIndices([]);
  }

  /** Load saved facts and generation settings; clear posts so you can generate new drafts. */
  function reuseFactsFromRun(run: GenerationRun) {
    const r = run.report;
    setError(null);
    setResearchInfo(r.researchInfo ?? null);
    setResearchPipelineUsed(r.researchPipelineUsed ?? r.researchMode);
    setTopic(r.topic);
    setFacts(r.selectedFacts);
    setSelected(r.selectedFacts.map(() => true));
    setPinned(r.selectedFacts.map(() => false));
    setPosts([]);
    setPostFactsUsed([]);
    setTone(r.generationOptions.tone);
    setLength(r.generationOptions.length);
    setPostStyles(
      r.generationOptions.postStyles.length > 0
        ? [...r.generationOptions.postStyles]
        : [...POST_STYLES]
    );
    setResearchMode(r.researchMode);
    setTemplateVariant(0);
    setSlotRegenBumps([]);
    setRegeneratingPostIndex(null);
    setAiImprovingPostIndex(null);
    setAiImproveErrorIndex(null);
    setAiImproveErrorMessage(null);
    setCompareIndices([]);
  }

  const hasFacts = facts.length > 0;
  const anySelected = selected.some(Boolean);
  const canGeneratePosts = hasFacts && anySelected && postStyles.length > 0;
  const canRegenerateToolbar = canGeneratePosts && posts.length > 0;
  const selectedFacts = filterFactsForGeneration(facts, selected);
  const selectedFactsCount = selectedFacts.length;
  const showDraftPackage =
    posts.length > 0 || (hasFacts && anySelected && postStyles.length > 0);

  const workflowStep = getWorkflowStep({
    factsCount: facts.length,
    factsLoading,
    postsCount: posts.length,
    postsLoading
  });

  const { warnings: sessionWarnings, exportIssues } = useMemo(
    () =>
      deriveSessionWarningsWithExportIssues({
        requestedResearchMode: researchMode,
        researchPipelineUsed,
        researchInfo,
        facts
      }),
    [researchMode, researchPipelineUsed, researchInfo, facts]
  );

  const sessionWorkflowConfig = useMemo(
    () =>
      buildSessionWorkflowConfig({
        topic,
        researchMode,
        preferredTone: tone,
        preferredLength: length,
        preferredPostStyles: postStyles,
        settingsAutomationCandidate: automationCandidates.settingsProfile
      }),
    [
      topic,
      researchMode,
      tone,
      length,
      postStyles,
      automationCandidates.settingsProfile
    ]
  );

  const sessionRunReport = useMemo(
    () =>
      buildSessionContentRunReport({
        topic,
        researchMode,
        researchPipelineUsed,
        researchInfo,
        facts,
        selectedFacts: filterFactsForGeneration(facts, selected),
        posts,
        postFactsUsed:
          postFactsUsed.length === posts.length ? postFactsUsed : undefined,
        generationOptions: {
          tone,
          length,
          postStyles,
          templateVariant
        },
        issues: exportIssues,
        contentBrief: brief
      }),
    [
      topic,
      researchMode,
      researchPipelineUsed,
      researchInfo,
      facts,
      selected,
      posts,
      postFactsUsed,
      tone,
      length,
      postStyles,
      templateVariant,
      exportIssues,
      brief
    ]
  );

  return (
    <main className="mx-auto max-w-4xl px-4 py-8 sm:py-10">
      <header className="mb-8 sm:mb-10">
        <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
          KAWN Content Creator Agent
        </h1>
        <p className="mt-2 max-w-2xl text-slate-600">
          Draft KAWN content from a topic: research, review sources, pick facts, generate KAWN
          Posts, then export or revisit past runs.
        </p>
      </header>

      <div className="mb-6 sm:mb-8">
        <WorkflowIndicator step={workflowStep} />
      </div>

      {error ? (
        <p
          className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
          role="alert"
        >
          {error}
        </p>
      ) : null}

      <div className="flex flex-col gap-6 sm:gap-8">
        <PageSection
          title="Research input"
          description="Enter a topic, choose mock or live web (when configured), then load facts."
        >
          <TopicForm
            topic={topic}
            onTopicChange={setTopic}
            researchMode={researchMode}
            onResearchModeChange={setResearchMode}
            onLoadFacts={loadFacts}
            busy={factsLoading}
          />
          <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <label className="flex cursor-pointer flex-wrap items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={automationCandidates.settingsProfile}
                onChange={(e) =>
                  setAutomationCandidates(
                    setSettingsProfileAutomationCandidate(e.target.checked)
                  )
                }
                disabled={busy}
                className="h-4 w-4 shrink-0 rounded border-slate-300"
              />
              <span>Mark saved preferences as automation candidate</span>
              {automationCandidates.settingsProfile ? <AutomationCandidateIndicator /> : null}
            </label>
            <button
              type="button"
              suppressHydrationWarning
              onClick={resetPreferences}
              disabled={busy}
              className="shrink-0 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              title="Clear saved preferences and restore defaults"
            >
              Reset preferences
            </button>
          </div>
          <div className="mt-4">
            <WatchlistPanel
              items={watchlist}
              currentTopic={topic}
              onPickTopic={(t) => setTopic(t)}
              onAddTopic={addWatchTopic}
              onRemove={removeWatchTopic}
              onRunResearch={(t) => void loadFacts(t)}
              onUpdateRecurring={updateWatchTopicRecurring}
              automationWatchlistIds={automationCandidates.watchlistIds}
              onToggleAutomationCandidate={(id) =>
                setAutomationCandidates(toggleWatchlistAutomationCandidate(id))
              }
              sessionDefaults={pickSessionDefaults(sessionWorkflowConfig)}
              busy={factsLoading}
            />
          </div>
          <div className="mt-4 rounded-lg border border-slate-200 bg-white p-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-900">Suggest topics</p>
                <p className="mt-0.5 text-sm text-slate-600">
                  Quick, actionable ideas you can click to fill the topic box.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <label className="inline-flex items-center gap-2 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    checked={topicSuggestUseAi}
                    onChange={(e) => setTopicSuggestUseAi(e.target.checked)}
                    disabled={busy || topicSuggestLoading}
                    className="h-4 w-4 rounded border-slate-300"
                  />
                  Use AI (if available)
                </label>
                <button
                  type="button"
                  suppressHydrationWarning
                  onClick={suggestTopics}
                  disabled={busy || topicSuggestLoading}
                  className="rounded-md border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm font-medium text-slate-800 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {topicSuggestLoading ? 'Working…' : 'Suggest topics'}
                </button>
              </div>
            </div>
            {topicSuggestError ? (
              <p className="mt-2 text-sm text-amber-800" role="status">
                {topicSuggestError}
              </p>
            ) : null}
            {topicSuggestions.length > 0 ? (
              <div className="mt-3 flex flex-wrap gap-2">
                {topicSuggestions.map((t) => (
                  <button
                    key={t}
                    type="button"
                    suppressHydrationWarning
                    onClick={() => setTopic(t)}
                    className="rounded-full border border-slate-200 bg-white px-3 py-1 text-sm text-slate-800 hover:bg-slate-50"
                    title="Click to use this topic"
                  >
                    {t}
                  </button>
                ))}
              </div>
            ) : null}
          </div>
          {sessionWarnings.length > 0 ? (
            <div className="mt-4">
              <WarningsPanel warnings={sessionWarnings} />
            </div>
          ) : null}
        </PageSection>

        <PageSection
          title="Sources found"
          description="Pages and URLs your facts are tied to (deduplicated). Expand each block to review."
        >
          {hasFacts ? (
            <SourceReviewSection facts={facts} />
          ) : (
            <p className="rounded-lg border border-dashed border-slate-200 bg-slate-50/60 px-4 py-8 text-center text-sm text-slate-500">
              Load research above to see sources here.
            </p>
          )}
        </PageSection>

        <PageSection
          title="Facts extracted"
          description="Pin rows, choose facts, pick post styles (one draft per style), then tone and length."
        >
          <FactsList
            facts={facts}
            selected={selected}
            pinned={pinned}
            onToggle={toggleFact}
            onTogglePin={togglePin}
            onSelectAll={selectAllFacts}
            onDeselectAll={deselectAllFacts}
            onSelectHighConfidence={selectHighConfidenceFacts}
            emptyHint="Load facts for your topic first."
          />
          <div className="mt-4 space-y-4 border-t border-slate-100 pt-4">
            <PostStyleSelect
              value={postStyles}
              onChange={setPostStyles}
              disabled={postsLoading}
            />
            <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between">
            <div className="flex flex-col gap-4 sm:flex-row sm:gap-6">
              <ToneSelect value={tone} onChange={setTone} disabled={postsLoading} />
              <LengthSelect value={length} onChange={setLength} disabled={postsLoading} />
            </div>
            <div className="flex flex-col items-stretch gap-2 sm:flex-row sm:items-center">
              <label className="inline-flex items-center gap-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={briefUseAi}
                  onChange={(e) => setBriefUseAi(e.target.checked)}
                  disabled={busy || briefLoading}
                  className="h-4 w-4 rounded border-slate-300"
                />
                AI enhance brief (optional)
              </label>
              <button
                type="button"
                suppressHydrationWarning
                onClick={generateBrief}
                disabled={busy || selectedFacts.length === 0 || briefLoading}
                className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-800 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {briefLoading ? 'Working…' : 'Generate brief'}
              </button>
              <button
                type="button"
                suppressHydrationWarning
                onClick={generatePosts}
                disabled={busy || !canGeneratePosts || postSlotBusy}
                className="shrink-0 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-900 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {postsLoading ? 'Working…' : 'Generate KAWN Posts'}
              </button>
            </div>
            </div>
          </div>
          <div className="mt-4">
            <ContentBriefPanel brief={brief} loading={briefLoading} error={briefError} />
          </div>
          {hasFacts && !anySelected ? (
            <p className="mt-3 text-sm text-amber-800">Select at least one fact to generate KAWN Posts.</p>
          ) : null}
        </PageSection>

        <PageSection
          title="Generated KAWN Posts"
          description="One KAWN Post Draft per selected post style. Edit, regenerate for a new template rotation, or export."
        >
          {canRegenerateToolbar ? (
            <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <label className="inline-flex items-center gap-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={aiAssistQuickPolish}
                  onChange={(e) => setAiAssistQuickPolish(e.target.checked)}
                  disabled={busy || postSlotBusy}
                  className="h-4 w-4 rounded border-slate-300"
                />
                AI assist quick polish (optional)
              </label>
              <button
                type="button"
                suppressHydrationWarning
                onClick={regeneratePosts}
                disabled={busy || postSlotBusy}
                className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm font-medium text-slate-800 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {postsLoading ? 'Working…' : 'Regenerate all KAWN Posts'}
              </button>
            </div>
          ) : null}
          {posts.length >= 2 ? (
            <p className="mb-3 text-xs text-slate-600">
              Check <span className="font-medium">Compare</span> on two or more drafts to open a
              comparison below. Edit and copy still work on each card.
            </p>
          ) : null}
          <PostsList
            posts={posts}
            postFactsUsed={postFactsUsed}
            postStyles={postStyles}
            onUpdatePost={updatePost}
            onRegeneratePost={posts.length > 0 ? regenerateSinglePost : undefined}
            regeneratingPostIndex={regeneratingPostIndex}
            onAiImprovePost={
              posts.length > 0 && canGeneratePosts ? aiImprovePost : undefined
            }
            aiImprovingPostIndex={aiImprovingPostIndex}
            aiImproveErrorIndex={aiImproveErrorIndex}
            aiImproveErrorMessage={aiImproveErrorMessage}
            aiQuickEditsEnabled={aiAssistQuickPolish}
            onAiQuickEditPost={aiQuickEditPost}
            compareIndices={compareIndices}
            onToggleCompare={toggleCompareDraft}
            emptyHint={
              hasFacts
                ? 'Choose tone and length, then click “Generate KAWN Posts”.'
                : 'KAWN Post Drafts appear here after you load facts and generate.'
            }
          />
          <div className="mt-4">
            <CompareDraftsPanel
              posts={posts}
              postStyles={postStyles}
              indices={compareIndices}
              onClear={() => setCompareIndices([])}
            />
          </div>
          {showDraftPackage ? (
            <div className="mt-4">
              <DraftPackageSummary
                topic={topic}
                selectedFactsCount={selectedFactsCount}
                tone={tone}
                length={length}
                postStyles={postStyles}
                postsCount={posts.length}
              />
            </div>
          ) : null}
          {posts.length > 0 ? (
            <div className="mt-4">
              <DraftToPublishPackage runReport={sessionRunReport} />
            </div>
          ) : null}
          <ExportPosts runReport={sessionRunReport} />
        </PageSection>

        <PageSection
          title="History"
          description="Snapshots from this browser only—not synced to a server. Restore everything or reload facts to draft new posts."
        >
          <HistoryPanel
            runs={historyRuns}
            onRestoreFull={restoreRunFull}
            onReuseFacts={reuseFactsFromRun}
            automationRunIds={automationCandidates.runIds}
            onToggleAutomationCandidate={(id) =>
              setAutomationCandidates(toggleRunAutomationCandidate(id))
            }
          />
        </PageSection>
      </div>

      <footer className="mt-12 border-t border-slate-200 pt-8 text-center text-sm text-slate-500">
        Developed by:{' '}
        <span className="font-medium text-slate-700">Mohamed Gougam</span>
      </footer>
    </main>
  );
}
