'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  applyPostQuickEdit,
  POST_QUICK_EDIT_ACTIONS,
  type PostQuickEditAction
} from '@/lib/postQuickEdits';
import { stripHtmlTags } from '@/lib/stripHtml';

type PostCardProps = {
  /** 1-based label for the card. */
  number: number;
  /** Text from parent (API or last save). */
  text: string;
  /** Called when the user saves edits (updates parent state only). */
  onSave: (nextText: string) => void;
  /** Regenerate this draft only (optional). */
  onRegenerateThisPost?: () => void;
  /** True while any card is regenerating — disables all regen buttons. */
  regenerateLocked?: boolean;
  /** True while this card’s regen request is in flight. */
  regenerateWorking?: boolean;
  /** Optional AI rewrite (server needs `OPENAI_API_KEY`). */
  onAiImprove?: () => void;
  /** True while any card is doing AI improve — disables polish / AI until done. */
  aiImproveLocked?: boolean;
  aiImproveWorking?: boolean;
  /** Shown under the post when the last AI improve failed for this card. */
  aiImproveError?: string | null;
  /** Optional: AI-assist the quick polish buttons (falls back to deterministic). */
  aiQuickEditsEnabled?: boolean;
  onAiQuickEdit?: (action: PostQuickEditAction, currentText: string) => Promise<string>;
};

/** One LinkedIn-style draft: view / edit, copy, optional single regeneration. */
export function PostCard({
  number,
  text,
  onSave,
  onRegenerateThisPost,
  regenerateLocked = false,
  regenerateWorking = false,
  onAiImprove,
  aiImproveLocked = false,
  aiImproveWorking = false,
  aiImproveError = null,
  aiQuickEditsEnabled = false,
  onAiQuickEdit
}: PostCardProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(text);
  const [copied, setCopied] = useState(false);
  const [quickAiWorking, setQuickAiWorking] = useState(false);
  const [quickAiError, setQuickAiError] = useState<string | null>(null);
  const resetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setDraft(text);
    setEditing(false);
  }, [text]);

  useEffect(() => {
    return () => {
      if (resetTimer.current) clearTimeout(resetTimer.current);
    };
  }, []);

  const copyText = editing ? draft : stripHtmlTags(text);

  const copy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(copyText);
      setCopied(true);
      if (resetTimer.current) clearTimeout(resetTimer.current);
      resetTimer.current = setTimeout(() => {
        setCopied(false);
        resetTimer.current = null;
      }, 2000);
    } catch {
      setCopied(false);
    }
  }, [copyText]);

  function startEdit() {
    setDraft(text);
    setEditing(true);
  }

  function save() {
    onSave(draft);
    setEditing(false);
  }

  function cancel() {
    setDraft(text);
    setEditing(false);
  }

  async function runQuickEdit(action: PostQuickEditAction) {
    const source = editing ? draft : stripHtmlTags(text);
    setQuickAiError(null);

    if (aiQuickEditsEnabled && onAiQuickEdit && !aiImproveLocked) {
      setQuickAiWorking(true);
      try {
        const improved = await onAiQuickEdit(action, source);
        if (editing) setDraft(improved);
        else onSave(improved);
        return;
      } catch (e) {
        const msg =
          e instanceof Error ? e.message : 'AI assist failed; used the standard edit instead.';
        setQuickAiError(msg);
        // Fall back to deterministic behavior below.
      } finally {
        setQuickAiWorking(false);
      }
    }

    const next = applyPostQuickEdit(source, action);
    if (editing) setDraft(next);
    else onSave(next);
  }

  const quickLocked = regenerateLocked || aiImproveLocked || quickAiWorking;
  const regenDisabled = Boolean(onRegenerateThisPost && (regenerateLocked || editing));
  const aiDisabled = Boolean(
    onAiImprove && (editing || aiImproveLocked || aiImproveWorking)
  );

  return (
    <article className="flex flex-col rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-2 flex flex-wrap items-start justify-between gap-2">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          Sample post {number}
        </h3>
        <div className="flex shrink-0 flex-wrap gap-1.5">
          {editing ? (
            <>
              <button
                type="button"
                suppressHydrationWarning
                onClick={save}
                className="rounded-md border border-slate-900 bg-slate-900 px-2.5 py-1 text-xs font-medium text-white hover:bg-slate-800"
              >
                Save
              </button>
              <button
                type="button"
                suppressHydrationWarning
                onClick={cancel}
                className="rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                suppressHydrationWarning
                onClick={startEdit}
                className="rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 shadow-sm hover:bg-slate-50"
              >
                Edit
              </button>
              <button
                type="button"
                suppressHydrationWarning
                onClick={copy}
                aria-label={`Copy post ${number} to clipboard`}
                className="rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 shadow-sm hover:bg-slate-50"
              >
                {copied ? (
                  <span className="text-emerald-700">Copied</span>
                ) : (
                  'Copy'
                )}
              </button>
              {onRegenerateThisPost ? (
                <button
                  type="button"
                  suppressHydrationWarning
                  onClick={onRegenerateThisPost}
                  disabled={regenDisabled}
                  className="rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 shadow-sm hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {regenerateWorking ? 'Working…' : 'Regenerate this post'}
                </button>
              ) : null}
              {onAiImprove ? (
                <button
                  type="button"
                  suppressHydrationWarning
                  onClick={onAiImprove}
                  disabled={aiDisabled}
                  className="rounded-md border border-indigo-200 bg-indigo-50 px-2.5 py-1 text-xs font-medium text-indigo-900 shadow-sm hover:bg-indigo-100 disabled:cursor-not-allowed disabled:opacity-50"
                  title="Polish with AI using only your selected facts (needs OPENAI_API_KEY on the server)"
                >
                  {aiImproveWorking ? 'Improving…' : 'AI improve'}
                </button>
              ) : null}
            </>
          )}
        </div>
      </div>

      <div className="mb-3 flex flex-col gap-1.5 border-b border-slate-100 pb-3">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
            Quick polish
          </span>
          {quickAiWorking ? (
            <span className="text-[11px] font-medium text-indigo-800">AI…</span>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-1.5">
          {POST_QUICK_EDIT_ACTIONS.map(({ id, label }) => (
            <button
              key={id}
              type="button"
              suppressHydrationWarning
              disabled={quickLocked}
              onClick={() => runQuickEdit(id)}
              className="rounded border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] font-medium text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {editing ? (
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          rows={14}
          suppressHydrationWarning
          className="w-full resize-y rounded-md border border-slate-300 bg-white px-3 py-2 font-sans text-sm text-slate-800 shadow-sm focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-300"
          aria-label={`Edit post ${number}`}
        />
      ) : (
        <pre className="whitespace-pre-wrap font-sans text-sm text-slate-800">
          {stripHtmlTags(text)}
        </pre>
      )}
      {aiImproveError ? (
        <p
          className="mt-2 rounded-md border border-amber-200 bg-amber-50/90 px-2 py-1.5 text-xs text-amber-950"
          role="status"
        >
          {aiImproveError}
        </p>
      ) : null}
      {quickAiError ? (
        <p
          className="mt-2 rounded-md border border-amber-200 bg-amber-50/90 px-2 py-1.5 text-xs text-amber-950"
          role="status"
        >
          {quickAiError}
        </p>
      ) : null}
    </article>
  );
}
