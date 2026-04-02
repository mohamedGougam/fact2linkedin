'use client';

import { PostCard } from '@/components/PostCard';

type PostsListProps = {
  posts: string[];
  emptyHint: string;
  /** Update one post in parent state (index + new body). */
  onUpdatePost: (index: number, nextText: string) => void;
  /** Regenerate one slot by index (same order as current `posts` / `postStyles`). */
  onRegeneratePost?: (index: number) => void;
  /** When set, that slot is loading; all regen buttons stay disabled until cleared. */
  regeneratingPostIndex?: number | null;
};

/** Post cards in a responsive grid; optional per-post regeneration. */
export function PostsList({
  posts,
  emptyHint,
  onUpdatePost,
  onRegeneratePost,
  regeneratingPostIndex = null
}: PostsListProps) {
  if (posts.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-slate-300 bg-white/80 px-4 py-6 text-sm text-slate-500">
        {emptyHint}
      </p>
    );
  }

  const regenBusy = regeneratingPostIndex !== null;

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
        />
      ))}
    </div>
  );
}
