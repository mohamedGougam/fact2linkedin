'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { ContentRunReport } from '@/lib/contentRunReport';
import {
  buildCopyAllPostsClipboard,
  buildMarkdownExportFromReport,
  buildPlainTextExportFromReport,
  downloadTextFile,
  exportFilename
} from '@/lib/exportContent';

type ExportPostsProps = {
  /** Same structured snapshot used for history — drives plain/Markdown export. */
  runReport: ContentRunReport;
};

/** Download current topic, facts, and posts as .txt or .md — all client-side. */
export function ExportPosts({ runReport }: ExportPostsProps) {
  const [copiedAll, setCopiedAll] = useState(false);
  const copyAllTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const posts = runReport.posts;
  const postStyles = runReport.generationOptions.postStyles;

  useEffect(() => {
    return () => {
      if (copyAllTimer.current) clearTimeout(copyAllTimer.current);
    };
  }, []);

  const copyAllPosts = useCallback(async () => {
    const payload = buildCopyAllPostsClipboard(posts, postStyles);
    try {
      await navigator.clipboard.writeText(payload);
      setCopiedAll(true);
      if (copyAllTimer.current) clearTimeout(copyAllTimer.current);
      copyAllTimer.current = setTimeout(() => {
        setCopiedAll(false);
        copyAllTimer.current = null;
      }, 2000);
    } catch {
      setCopiedAll(false);
    }
  }, [posts, postStyles]);

  if (posts.length === 0) {
    return null;
  }

  function exportAsPlainText() {
    const text = buildPlainTextExportFromReport(runReport);
    downloadTextFile(exportFilename('txt'), text, 'text/plain;charset=utf-8');
  }

  function exportAsMarkdown() {
    const text = buildMarkdownExportFromReport(runReport);
    downloadTextFile(exportFilename('md'), text, 'text/markdown;charset=utf-8');
  }

  return (
    <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-2 border-t border-slate-100 pt-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-medium uppercase tracking-wide text-slate-500">
          Export
        </span>
        <button
          type="button"
          suppressHydrationWarning
          onClick={exportAsPlainText}
          className="rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-800 hover:bg-slate-50"
        >
          Plain text (.txt)
        </button>
        <button
          type="button"
          suppressHydrationWarning
          onClick={exportAsMarkdown}
          className="rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-800 hover:bg-slate-50"
        >
          Markdown (.md)
        </button>
      </div>
      <div className="flex flex-wrap items-center gap-2 border-slate-200 sm:border-l sm:pl-3">
        <button
          type="button"
          suppressHydrationWarning
          onClick={copyAllPosts}
          className="rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-800 hover:bg-slate-50"
        >
          {copiedAll ? (
            <span className="text-emerald-700">Copied all</span>
          ) : (
            'Copy all posts'
          )}
        </button>
      </div>
    </div>
  );
}
