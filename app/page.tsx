'use client';

/** Home: research → sources → facts → posts → history. */

import { useEffect, useMemo, useState } from 'react';
import { DraftPackageSummary } from '@/components/DraftPackageSummary';
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
import { WarningsPanel } from '@/components/WarningsPanel';
import { WorkflowIndicator } from '@/components/WorkflowIndicator';
import { POST_STYLES, type PostStyle } from '@/lib/postStyle';
import { TEMPLATE_VARIANT_COUNT } from '@/lib/templatePosts';
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
import type { Fact } from '@/lib/types/fact';
import type { Tone } from '@/lib/tone';

export default function HomePage() {
  const [topic, setTopic] = useState('');
  const [facts, setFacts] = useState<Fact[]>([]);
  /** Parallel to facts[i]: whether this fact is included when generating posts. */
  const [selected, setSelected] = useState<boolean[]>([]);
  /** Parallel to facts[i]: pinned facts sort to the top of the list (display only). */
  const [pinned, setPinned] = useState<boolean[]>([]);
  const [tone, setTone] = useState<Tone>('professional');
  const [length, setLength] = useState<PostLength>('short');
  /** Which archetypes to generate (one post per selected style). */
  const [postStyles, setPostStyles] = useState<PostStyle[]>(() => [...POST_STYLES]);
  /** Which deterministic template rotation was last used (0..TEMPLATE_VARIANT_COUNT-1). */
  const [templateVariant, setTemplateVariant] = useState(0);
  const [posts, setPosts] = useState<string[]>([]);
  const [factsLoading, setFactsLoading] = useState(false);
  const [postsLoading, setPostsLoading] = useState(false);
  /** Which post index is currently regenerating alone (null = none). */
  const [regeneratingPostIndex, setRegeneratingPostIndex] = useState<number | null>(null);
  /** Per-slot template bumps so repeated single regens rotate wording. */
  const [slotRegenBumps, setSlotRegenBumps] = useState<number[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [researchInfo, setResearchInfo] = useState<string | null>(null);
  /** Last successful `/api/facts` pipeline (`null` before first load this session). */
  const [researchPipelineUsed, setResearchPipelineUsed] = useState<'mock' | 'web' | null>(
    null
  );
  const [researchMode, setResearchMode] = useState<ResearchModeChoice>('mock');
  const [historyRuns, setHistoryRuns] = useState<GenerationRun[]>([]);

  useEffect(() => {
    setHistoryRuns(loadRuns());
  }, []);

  const busy = factsLoading || postsLoading;
  const singlePostRegenBusy = regeneratingPostIndex !== null;

  async function loadFacts() {
    setError(null);
    setResearchInfo(null);
    setResearchPipelineUsed(null);
    setFactsLoading(true);
    try {
      const result = await runResearchPhase({ topic, researchMode });

      if (!result.ok) {
        setError(result.error);
        return;
      }

      const nextFacts = result.facts;
      setFacts(nextFacts);
      setSelected(nextFacts.map(() => true));
      setPinned(nextFacts.map(() => false));
      setPosts([]);
      setTemplateVariant(0);
      setResearchInfo(result.info);
      setResearchPipelineUsed(result.researchModeUsed);
    } finally {
      setFactsLoading(false);
    }
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
      setPosts(nextPosts);
      setTemplateVariant(variant);
      setSlotRegenBumps(nextPosts.map(() => 0));

      setHistoryRuns(
        appendRun(
          packageHistoryRun({
            topic,
            facts,
            selectedFacts: result.factsUsed,
            posts: nextPosts,
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

  return (
    <main className="mx-auto max-w-4xl px-4 py-8 sm:py-10">
      <header className="mb-8 sm:mb-10">
        <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
          Fact2LinkedIn
        </h1>
        <p className="mt-2 max-w-2xl text-slate-600">
          Draft LinkedIn content from a topic: research, review sources, pick facts, generate
          posts, then export or revisit past runs.
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
            <button
              type="button"
              suppressHydrationWarning
              onClick={generatePosts}
              disabled={busy || !canGeneratePosts || singlePostRegenBusy}
              className="shrink-0 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-900 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {postsLoading ? 'Working…' : 'Generate LinkedIn posts'}
            </button>
            </div>
          </div>
          {hasFacts && !anySelected ? (
            <p className="mt-3 text-sm text-amber-800">Select at least one fact to generate posts.</p>
          ) : null}
        </PageSection>

        <PageSection
          title="Generated LinkedIn posts"
          description="One draft per selected post style. Edit, regenerate for a new template rotation, or export."
        >
          {canRegenerateToolbar ? (
            <div className="mb-4 flex justify-end">
              <button
                type="button"
                suppressHydrationWarning
                onClick={regeneratePosts}
                disabled={busy || singlePostRegenBusy}
                className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm font-medium text-slate-800 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {postsLoading ? 'Working…' : 'Regenerate all posts'}
              </button>
            </div>
          ) : null}
          <PostsList
            posts={posts}
            onUpdatePost={updatePost}
            onRegeneratePost={posts.length > 0 ? regenerateSinglePost : undefined}
            regeneratingPostIndex={regeneratingPostIndex}
            emptyHint={
              hasFacts
                ? 'Choose tone and length, then click “Generate LinkedIn posts”.'
                : 'Posts appear here after you load facts and generate.'
            }
          />
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
          <ExportPosts
            runReport={buildSessionContentRunReport({
              topic,
              researchMode,
              researchPipelineUsed,
              researchInfo,
              facts,
              selectedFacts,
              posts,
              generationOptions: {
                tone,
                length,
                postStyles,
                templateVariant
              },
              issues: exportIssues
            })}
          />
        </PageSection>

        <PageSection
          title="History"
          description="Snapshots from this browser only—not synced to a server. Restore everything or reload facts to draft new posts."
        >
          <HistoryPanel
            runs={historyRuns}
            onRestoreFull={restoreRunFull}
            onReuseFacts={reuseFactsFromRun}
          />
        </PageSection>
      </div>
    </main>
  );
}
