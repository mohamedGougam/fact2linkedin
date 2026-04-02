import type { Fact, SourceType } from '@/lib/types/fact';

/**
 * Source rows for the **Sources found** UI (`SourceReviewSection`).
 * Export/history use `deriveSourcesFromFacts` in `contentRunReport.ts` (lighter shape).
 */

/** One row in the source review list (deduped by URL). */
export type SourceReviewRow = {
  url: string;
  title: string;
  sourceType: SourceType | null;
  publisherOrDomain: string;
  publishedAt: string | null;
};

function hostname(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
}

function mergeString(a: string | undefined, b: string | undefined): string | undefined {
  const x = a?.trim();
  const y = b?.trim();
  if (x && y && y.length > x.length) return y;
  return x || y;
}

function mergePublished(a: string | undefined, b: string | undefined): string | undefined {
  const x = a?.trim();
  const y = b?.trim();
  return x || y;
}

/**
 * Unique sources behind the current fact set (primary URLs + “also cited” refs), stable order by first appearance.
 */
export function uniqueSourcesFromFacts(facts: Fact[]): SourceReviewRow[] {
  const byKey = new Map<string, SourceReviewRow>();

  function upsert(
    url: string,
    patch: {
      title: string;
      sourceType: SourceType | null;
      publisher?: string;
      publishedAt?: string;
    }
  ) {
    let key: string;
    try {
      key = new URL(url).href;
    } catch {
      key = url.trim();
    }
    const prev = byKey.get(key);
    const pub = patch.publisher?.trim();
    const host = hostname(url);
    const publisherOrDomain = pub || host;

    if (!prev) {
      byKey.set(key, {
        url,
        title: patch.title.trim() || host,
        sourceType: patch.sourceType,
        publisherOrDomain,
        publishedAt: patch.publishedAt?.trim() || null
      });
      return;
    }

    prev.title = mergeString(prev.title, patch.title) ?? prev.title;
    if (patch.sourceType && !prev.sourceType) prev.sourceType = patch.sourceType;
    prev.publisherOrDomain = mergeString(prev.publisherOrDomain, publisherOrDomain) ?? prev.publisherOrDomain;
    prev.publishedAt =
      mergePublished(prev.publishedAt ?? undefined, patch.publishedAt)?.trim() ?? prev.publishedAt;
  }

  for (const f of facts) {
    const title = (f.sourceTitle?.trim() || f.sourceName).trim() || hostname(f.sourceUrl);
    upsert(f.sourceUrl, {
      title,
      sourceType: f.sourceType,
      publisher: f.publisher,
      publishedAt: f.publishedAt
    });

    for (const ref of f.additionalSourceRefs ?? []) {
      upsert(ref.sourceUrl, {
        title: (ref.sourceTitle?.trim() || ref.sourceName).trim() || hostname(ref.sourceUrl),
        sourceType: null,
        publisher: undefined,
        publishedAt: undefined
      });
    }
  }

  return [...byKey.values()];
}
