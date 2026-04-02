'use client';

import { PostCard } from '@/components/PostCard';
import type { PostQuickEditAction } from '@/lib/postQuickEdits';

type PostsListProps = {
  posts: string[];
  emptyHint: string;
  /** Update one post in parent state (index + new body). */
  onUpdatePost: (index: number, nextText: string) => void;
  /** Regenerate one slot by index (same order as current `posts` / `postStyles`). */
  onRegeneratePost?: (index: number) => void;
  /** When set, that slot is loading; all regen buttons stay disabled until cleared. */
  regeneratingPostIndex?: number | null;
  /** Optional AI rewrite (requires server `OPENAI_API_KEY`). */
  onAiImprovePost?: (index: number) => void;
  /** When set, that slot shows “Improving…” for AI. */
  aiImprovingPostIndex?: number | null;
  /** Friendly error for the card at this index (if any). */
  aiImproveErrorIndex?: number | null;
  aiImproveErrorMessage?: string | null;
  /** Optional: AI-assist the quick polish buttons (falls back to deterministic). */
  aiQuickEditsEnabled?: boolean;
  onAiQuickEditPost?: (
    index: number,
    action: PostQuickEditAction,
    currentText: string
  ) => Promise<string>;
};

/** Post cards in a responsive grid; optional per-post regeneration. */
export function PostsList({
  posts,
  emptyHint,
  onUpdatePost,
  onRegeneratePost,
  regeneratingPostIndex = null,
  onAiImprovePost,
  aiImprovingPostIndex = null,
  aiImproveErrorIndex = null,
  aiImproveErrorMessage = null,
  aiQuickEditsEnabled = false,
  onAiQuickEditPost
}: PostsListProps) {
  if (posts.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-slate-300 bg-white/80 px-4 py-6 text-sm text-slate-500">
        {emptyHint}
      </p>
    );
  }

  const regenBusy = regeneratingPostIndex !== null;
  const aiBusy = aiImprovingPostIndex !== null;
  const polishLocked = regenBusy || aiBusy;

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {posts.map((text, i) => (
        <PostCard
          key={i}
          number={i + 1}
          text={text}
          onSave={(next) => onUpdatePost(i, next)}
          onRegenerateThisPost={
            onRegeneratePost ? () => onRegeneratePost(i) : undefined
          }
          regenerateLocked={regenBusy}
          regenerateWorking={regeneratingPostIndex === i}
          onAiImprove={
            onAiImprovePost ? () => onAiImprovePost(i) : undefined
          }
          aiImproveLocked={polishLocked}
          aiImproveWorking={aiImprovingPostIndex === i}
          aiImproveError={
            aiImproveErrorIndex === i ? aiImproveErrorMessage : null
          }
          aiQuickEditsEnabled={aiQuickEditsEnabled}
          onAiQuickEdit={
            onAiQuickEditPost ? (action, currentText) => onAiQuickEditPost(i, action, currentText) : undefined
          }
        />
      ))}
    </div>
  );
}
