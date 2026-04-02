import type { ContentRunReport } from '@/lib/contentRunReport';
import { POST_STYLE_LABELS, type PostStyle } from '@/lib/postStyle';
import type { Fact } from '@/lib/types/fact';
import { stripHtmlTags } from '@/lib/stripHtml';

/** Visual separator between posts in clipboard (plain text, works in notes & email). */
const COPY_ALL_POSTS_RULE = '─'.repeat(64);

/** Fixed-width rules for .txt exports (ASCII-only for maximum compatibility). */
const TXT_DOUBLE = '='.repeat(72);
const TXT_SINGLE = '-'.repeat(72);

/**
 * Build downloadable file contents (no server — strings only, all in the browser).
 * Prefer {@link buildPlainTextExportFromReport} / {@link buildMarkdownExportFromReport}
 * so exports match the same {@link ContentRunReport} shape as history.
 */

/** @param exportedAt — When the user triggered the download (defaults to “now”). */
export function buildPlainTextExportFromReport(
  report: ContentRunReport,
  exportedAt: Date = new Date()
): string {
  const iso = exportedAt.toISOString();
  const modeLabel = report.researchMode === 'web' ? 'Web' : 'Mock';
  const go = report.generationOptions;
  const stylesHuman = go.postStyles.map((s) => POST_STYLE_LABELS[s]).join(', ');

  const lines: string[] = [
    TXT_DOUBLE,
    'FACT2LINKEDIN EXPORT',
    TXT_DOUBLE,
    '',
    'EXPORT TIMESTAMP',
    TXT_SINGLE,
    iso,
    '',
    'RUN SNAPSHOT (COMPLETED AT)',
    TXT_SINGLE,
    report.timestamp,
    '',
    'TOPIC',
    TXT_SINGLE,
    (report.topic || '(empty)').trim() || '(empty)',
    '',
    'RESEARCH MODE',
    TXT_SINGLE,
    modeLabel,
    '',
    'SOURCES (DEDUPED)',
    TXT_SINGLE,
    ...formatSourcesPlain(report.sources),
    '',
    'FACTS (ALL IN EDITOR)',
    TXT_SINGLE,
    ...formatFactsPlain(report.facts),
    '',
    'FACTS (SELECTED FOR GENERATION)',
    TXT_SINGLE,
    ...formatFactsPlain(report.selectedFacts),
    '',
    'GENERATION OPTIONS',
    TXT_SINGLE,
    `Tone: ${go.tone}`,
    `Length: ${go.length}`,
    `Template variant: ${go.templateVariant}`,
    `Post styles: ${stylesHuman || '(none)'}`,
    ''
  ];

  if (report.issues.length > 0) {
    lines.push('ISSUES & WARNINGS', TXT_SINGLE, ...formatIssuesPlain(report.issues), '');
  }

  lines.push(
    'GENERATED POSTS',
    TXT_SINGLE,
    ...formatPostsPlainExport(report.posts, go.postStyles)
  );

  return lines.join('\n').replace(/\n+$/, '') + '\n';
}

/** @param exportedAt — When the user triggered the download (defaults to “now”). */
export function buildMarkdownExportFromReport(
  report: ContentRunReport,
  exportedAt: Date = new Date()
): string {
  const iso = exportedAt.toISOString();
  const modeLabel = report.researchMode === 'web' ? 'Web' : 'Mock';
  const go = report.generationOptions;

  const lines: string[] = [
    '# Fact2LinkedIn export',
    '',
    '> Browser-only export — no data is sent to a server for storage.',
    '',
    '## Timestamps',
    '',
    `- **Exported at (UTC):** \`${iso}\``,
    `- **Run snapshot completed at (UTC):** \`${report.timestamp}\``,
    `- **Local display (export):** ${formatLocalTimestamp(exportedAt)}`,
    '',
    '---',
    '',
    '## Topic',
    '',
    report.topic.trim() ? report.topic : '_(empty)_',
    '',
    '---',
    '',
    '## Research mode',
    '',
    modeLabel,
    '',
    '---',
    '',
    '## Sources (deduped)',
    '',
    ...formatSourcesMarkdown(report.sources),
    '',
    '---',
    '',
    '## Facts — full set in editor',
    ''
  ];

  appendFactsMarkdown(lines, report.facts);

  lines.push('---', '', '## Facts — selected for generation', '');

  appendFactsMarkdown(lines, report.selectedFacts);

  lines.push(
    '---',
    '',
    '## Generation options',
    '',
    '| Field | Value |',
    '| :---- | :---- |',
    '| Tone | `' + String(go.tone) + '` |',
    '| Length | `' + String(go.length) + '` |',
    '| Template variant | `' + String(go.templateVariant) + '` |',
    '| Post styles | ' +
      (go.postStyles.length
        ? go.postStyles.map((s) => '`' + POST_STYLE_LABELS[s] + '`').join(', ')
        : '_(none)_') +
      ' |',
    ''
  );

  if (report.issues.length > 0) {
    lines.push('---', '', '## Issues & warnings', '', ...formatIssuesMarkdown(report.issues), '');
  }

  lines.push('---', '', '## Generated posts', '');

  report.posts.forEach((raw, i) => {
    const body = stripHtmlTags(raw ?? '').trimEnd();
    const style = go.postStyles[i];
    const title =
      style !== undefined
        ? `Post ${i + 1} — ${POST_STYLE_LABELS[style]}`
        : `Post ${i + 1}`;
    lines.push(`### ${title}`, '', '```text', body, '```', '');
    if (i < report.posts.length - 1) {
      lines.push('* * *', '');
    }
  });

  return lines.join('\n').replace(/\n+$/, '') + '\n';
}

function formatSourcesPlain(
  sources: ContentRunReport['sources']
): string[] {
  if (sources.length === 0) return ['(none)'];
  return sources.flatMap((s, i) => [
    `${i + 1}. ${s.sourceName}`,
    `   URL: ${s.sourceUrl}`,
    ...(s.sourceType ? [`   Type: ${s.sourceType}`] : []),
    ''
  ]);
}

function formatSourcesMarkdown(
  sources: ContentRunReport['sources']
): string[] {
  if (sources.length === 0) return ['_(none)_', ''];
  const out: string[] = [];
  sources.forEach((s, i) => {
    out.push(`${i + 1}. **${s.sourceName}** — ${s.sourceUrl}`);
    if (s.sourceType) out.push(`   - Type: ${s.sourceType}`);
  });
  out.push('');
  return out;
}

function formatIssuesPlain(
  issues: ContentRunReport['issues']
): string[] {
  return issues.flatMap((iss, i) => [
    `${i + 1}. [${iss.level.toUpperCase()}] ${iss.message}`,
    ...(iss.phase ? [`   Phase: ${iss.phase}`] : []),
    ''
  ]);
}

function formatIssuesMarkdown(
  issues: ContentRunReport['issues']
): string[] {
  return issues.flatMap((iss) => [
    `- **${iss.level}:** ${iss.message}` + (iss.phase ? ` _(phase: ${iss.phase})_` : ''),
    ''
  ]);
}

function appendFactsMarkdown(lines: string[], facts: Fact[]): void {
  facts.forEach((f, i) => {
    lines.push(`${i + 1}. ${f.text}`);
    lines.push(`   - **Fact id:** ${f.id ?? '(no id)'}`);
    lines.push(
      `   - **Source:** ${f.sourceName} (${f.sourceType}, ${f.sourceCategory ?? 'unknown'}) — ${f.sourceUrl}`
    );
    if (f.publisher) lines.push(`   - **Publisher:** ${f.publisher}`);
    if (f.publishedAt) lines.push(`   - **Published:** ${f.publishedAt}`);
    lines.push(`   - **Verification:** ${f.verificationStatus ?? 'unverified'}`);
    lines.push(`   - **Confidence:** ${Math.round(f.confidence)}%`);
    if (f.additionalSourceRefs?.length) {
      f.additionalSourceRefs.forEach((r, j) => {
        lines.push(`   - **Additional source ${j + 1}:** ${r.sourceName} — ${r.sourceUrl}`);
      });
    }
    lines.push('');
  });
}

function formatLocalTimestamp(d: Date): string {
  try {
    return d.toLocaleString(undefined, {
      dateStyle: 'full',
      timeStyle: 'medium'
    });
  } catch {
    return d.toString();
  }
}

function formatFactsPlain(facts: Fact[]): string[] {
  if (facts.length === 0) return ['(none)'];
  return facts.flatMap((f, i) => {
    const lines = [
      `${i + 1}. ${f.text}`,
      `   Fact id: ${f.id ?? '(no id)'}`,
      `   Source: ${f.sourceName} (${f.sourceType}, category: ${f.sourceCategory ?? 'unknown'})`,
      `   URL: ${f.sourceUrl}`
    ];
    if (f.publisher) lines.push(`   Publisher: ${f.publisher}`);
    if (f.publishedAt) lines.push(`   Published: ${f.publishedAt}`);
    lines.push(`   Verification: ${f.verificationStatus ?? 'unverified'}`);
    lines.push(`   Confidence: ${Math.round(f.confidence)}%`);
    if (f.additionalSourceRefs?.length) {
      f.additionalSourceRefs.forEach((r, j) => {
        lines.push(`   Additional source ${j + 1}: ${r.sourceName} — ${r.sourceUrl}`);
      });
    }
    lines.push('');
    return lines;
  });
}

function formatPostsPlainExport(posts: string[], postStyles: PostStyle[]): string[] {
  return posts.flatMap((raw, i) => {
    const body = stripHtmlTags(raw ?? '').trimEnd();
    const style = postStyles[i];
    const label =
      style !== undefined ? `Post ${i + 1} — ${POST_STYLE_LABELS[style]}` : `Post ${i + 1}`;
    return [`--- ${label} ---`, body, ''];
  });
}

/**
 * One clipboard string: every displayed post, clearly separated, with style labels
 * when `postStyles[i]` exists (same order as `posts`).
 */
export function buildCopyAllPostsClipboard(
  posts: string[],
  postStyles: PostStyle[]
): string {
  const chunks: string[] = [];

  for (let i = 0; i < posts.length; i++) {
    const raw = posts[i] ?? '';
    const body = stripHtmlTags(raw).trim();
    const style = postStyles[i];
    const styleLine =
      style !== undefined ? `${POST_STYLE_LABELS[style]} · Post ${i + 1}` : `Post ${i + 1}`;

    chunks.push(
      COPY_ALL_POSTS_RULE,
      styleLine,
      COPY_ALL_POSTS_RULE,
      '',
      body,
      ''
    );
  }

  return chunks.join('\n').replace(/\n+$/, '') + '\n';
}

/** Trigger a file download in the browser (no upload). */
export function downloadTextFile(filename: string, content: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.rel = 'noopener';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function exportFilename(extension: 'txt' | 'md'): string {
  const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  return `fact2linkedin-export-${stamp}.${extension}`;
}
