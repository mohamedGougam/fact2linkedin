'use client';

import type { ContentRunReport } from '@/lib/contentRunReport';
import { factsForPostSlot } from '@/lib/contentRunReport';
import { formatIsoTimestampUi } from '@/lib/formatIsoTimestamp';
import { POST_STYLE_LABELS, type PostStyle } from '@/lib/postStyle';

type DraftToPublishPackageProps = {
  runReport: ContentRunReport;
};

function researchLabel(mode: 'mock' | 'web'): string {
  return mode === 'mock' ? 'Mock' : 'Web';
}

/**
 * Full “draft → KAWN publishing” bundle: topic, settings, brief, warnings, facts, sources, KAWN Posts.
 * Shown when drafts exist; complements file export (same underlying report).
 */
export function DraftToPublishPackage({ runReport }: DraftToPublishPackageProps) {
  if (runReport.posts.length === 0) {
    return null;
  }

  const gen = runReport.generationOptions;
  const stylesLine = gen.postStyles.map((s) => POST_STYLE_LABELS[s]).join(' · ');
  const topicDisplay = runReport.topic.trim() ? runReport.topic.trim() : '—';
  const pipeline =
    runReport.researchPipelineUsed && runReport.researchPipelineUsed !== runReport.researchMode
      ? `${researchLabel(runReport.researchMode)} (used ${researchLabel(runReport.researchPipelineUsed)})`
      : researchLabel(runReport.researchMode);

  return (
    <div className="rounded-xl border border-slate-200/90 bg-white px-4 py-4 shadow-sm ring-1 ring-slate-900/5 sm:px-5">
      <div className="flex flex-wrap items-start justify-between gap-2 border-b border-slate-100 pb-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-emerald-700/90">
            KAWN Publish Ready
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Workflow snapshot — {formatIsoTimestampUi(runReport.timestamp)}
          </p>
        </div>
        <p className="text-xs tabular-nums text-slate-500">
          {runReport.posts.length} KAWN Post Draft{runReport.posts.length === 1 ? '' : 's'}
        </p>
      </div>

      <section className="mt-4">
        <h3 className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
          Topic
        </h3>
        <p className="mt-1.5 text-sm font-medium leading-snug text-slate-900">{topicDisplay}</p>
      </section>

      <section className="mt-4">
        <h3 className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
          Research
        </h3>
        <p className="mt-1.5 text-xs leading-relaxed text-slate-700">{pipeline}</p>
        {runReport.researchInfo?.trim() ? (
          <p className="mt-1 text-xs leading-relaxed text-slate-500">{runReport.researchInfo.trim()}</p>
        ) : null}
      </section>

      <section className="mt-4">
        <h3 className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
          Generation settings
        </h3>
        <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-slate-700">
          <li>
            <span className="text-slate-400">Tone </span>
            {gen.tone}
          </li>
          <li>
            <span className="text-slate-400">Length </span>
            {gen.length}
          </li>
          <li>
            <span className="text-slate-400">Template rotation </span>
            {gen.templateVariant + 1}
          </li>
        </ul>
        <p className="mt-2 text-xs leading-relaxed text-slate-600">
          <span className="text-slate-400">Styles </span>
          {stylesLine}
        </p>
      </section>

      {runReport.contentBrief?.trim() ? (
        <section className="mt-4">
          <h3 className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            Content brief
          </h3>
          <div className="mt-2 max-h-48 overflow-y-auto rounded-lg border border-slate-100 bg-slate-50/80 px-3 py-2.5 text-xs leading-relaxed text-slate-800 whitespace-pre-wrap">
            {runReport.contentBrief.trim()}
          </div>
        </section>
      ) : null}

      {runReport.issues.length > 0 ? (
        <section className="mt-4">
          <h3 className="text-[11px] font-semibold uppercase tracking-wider text-amber-800">
            Warnings
          </h3>
          <ul className="mt-2 list-disc space-y-1 pl-4 text-xs text-amber-900/90">
            {runReport.issues.map((issue, i) => (
              <li key={`${issue.message}-${i}`}>
                <span className="font-medium">{issue.level === 'error' ? 'Error' : 'Warning'}: </span>
                {issue.message}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="mt-4">
        <h3 className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
          Facts in this run ({runReport.selectedFacts.length})
        </h3>
        <ol className="mt-2 list-decimal space-y-2 pl-4 text-xs leading-relaxed text-slate-800">
          {runReport.selectedFacts.map((f, i) => (
            <li key={f.id ?? `${i}-${f.text.slice(0, 24)}`}>{f.text}</li>
          ))}
        </ol>
      </section>

      <section className="mt-4">
        <h3 className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
          Sources ({runReport.sources.length})
        </h3>
        {runReport.sources.length === 0 ? (
          <p className="mt-2 text-xs text-slate-500">No distinct URLs recorded.</p>
        ) : (
          <ol className="mt-2 list-decimal space-y-2 pl-4 text-xs">
            {runReport.sources.map((s, i) => (
              <li key={`${s.sourceUrl}-${i}`} className="break-words text-slate-800">
                <span className="text-slate-700">{s.sourceName}</span>
                {s.sourceUrl ? (
                  <>
                    {' '}
                    <a
                      href={s.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-emerald-800 underline decoration-emerald-800/30 underline-offset-2 hover:text-emerald-900"
                    >
                      {s.sourceUrl}
                    </a>
                  </>
                ) : null}
                {s.sourceType ? (
                  <span className="text-slate-400"> ({s.sourceType})</span>
                ) : null}
              </li>
            ))}
          </ol>
        )}
      </section>

      <section className="mt-4 border-t border-slate-100 pt-4">
        <h3 className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
          Generated KAWN Posts
        </h3>
        <div className="mt-3 space-y-4">
          {runReport.posts.map((body, i) => {
            const style = gen.postStyles[i] as PostStyle | undefined;
            const label = style ? POST_STYLE_LABELS[style] : `Draft ${i + 1}`;
            const slotFacts = factsForPostSlot(runReport, i);
            return (
              <article
                key={i}
                className="rounded-lg border border-slate-100 bg-slate-50/50 px-3 py-3 sm:px-4"
              >
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <p className="text-xs font-semibold text-slate-800">{label}</p>
                  {slotFacts.length > 0 ? (
                    <p className="text-[11px] text-slate-500">
                      {slotFacts.length} fact{slotFacts.length === 1 ? '' : 's'} in slot
                    </p>
                  ) : null}
                </div>
                <pre className="mt-2 max-h-64 overflow-y-auto whitespace-pre-wrap font-sans text-xs leading-relaxed text-slate-800">
                  {body}
                </pre>
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
}
