/**
 * Domain- and host-based source classification and weak-source filtering.
 * Edit the lists below as you learn what works for your users — keep order: official → research → publication → blog → unknown.
 */

import type { SourceCategory } from '@/lib/types/fact';

// ---------------------------------------------------------------------------
// Drop these entirely (social UGC, common low-signal surfaces). Incomplete
// hostname/URL never filters here — see `isWeakSource`.
// ---------------------------------------------------------------------------
const BLOCKED_HOST_SUFFIXES = [
  'facebook.com',
  'fb.com',
  'twitter.com',
  'x.com',
  'instagram.com',
  'tiktok.com',
  'pinterest.com',
  'snapchat.com',
  'threads.net'
] as const;

// ---------------------------------------------------------------------------
// Official: government & major intergovernmental bodies (expand as needed)
// ---------------------------------------------------------------------------
const OFFICIAL_EXACT_HOSTS = [
  'europa.eu',
  'un.org',
  'who.int',
  'imo.org',
  'wmo.int',
  'iho.int',
  'state.gov',
  'nih.gov',
  'cdc.gov',
  'gov.uk'
] as const;

// ---------------------------------------------------------------------------
// Research: academia & primary research outlets
// ---------------------------------------------------------------------------
const RESEARCH_EXACT_HOSTS = [
  'arxiv.org',
  'ieee.org',
  'acm.org',
  'nature.com',
  'science.org',
  'springer.com',
  'sciencedirect.com',
  'pubmed.ncbi.nlm.nih.gov',
  'ncbi.nlm.nih.gov',
  'jstor.org',
  'semanticscholar.org'
] as const;

// ---------------------------------------------------------------------------
// Publication: mainstream / trade news (not blogs)
// ---------------------------------------------------------------------------
const PUBLICATION_EXACT_HOSTS = [
  'reuters.com',
  'bbc.com',
  'bbc.co.uk',
  'nytimes.com',
  'wsj.com',
  'ft.com',
  'economist.com',
  'theguardian.com',
  'bloomberg.com',
  'cnn.com',
  'apnews.com'
] as const;

// ---------------------------------------------------------------------------
// Blog / personal publishing platforms
// ---------------------------------------------------------------------------
const BLOG_EXACT_HOSTS = [
  'medium.com',
  'substack.com',
  'wordpress.com',
  'blogspot.com',
  'tumblr.com',
  'ghost.io'
] as const;

/** Normalize hostname from URL when the API did not send one. */
export function hostnameFromUrl(url: string): string | undefined {
  try {
    return new URL(url).hostname.toLowerCase();
  } catch {
    return undefined;
  }
}

function hostMatchesList(host: string, list: readonly string[]): boolean {
  return list.some((h) => host === h || host.endsWith(`.${h}`));
}

function hostBlocked(host: string): boolean {
  return hostMatchesList(host, BLOCKED_HOST_SUFFIXES);
}

/**
 * True if this result should not produce facts (e.g. social UGC).
 * If hostname is missing and URL cannot be parsed, returns **false** (keep result — incomplete metadata).
 */
export function isWeakSource(hostname: string | undefined, url: string): boolean {
  const host = (hostname?.trim().toLowerCase() || hostnameFromUrl(url) || '').trim();
  if (!host) return false;
  if (hostBlocked(host)) return true;
  return false;
}

/**
 * Classify by domain / host. Uses hostname when present, otherwise parses `url`.
 * Unknown TLDs / long-tail sites fall through to `unknown`.
 */
export function classifySourceCategory(
  hostname: string | undefined,
  url: string
): SourceCategory {
  const host = (hostname?.trim().toLowerCase() || hostnameFromUrl(url) || '').trim();
  if (!host) return 'unknown';

  if (host.endsWith('.gov') || host.endsWith('.gov.uk') || host.endsWith('.gouv.fr')) {
    return 'official';
  }
  if (hostMatchesList(host, OFFICIAL_EXACT_HOSTS)) return 'official';

  if (host.endsWith('.edu') || host.endsWith('.ac.uk')) return 'research';
  if (hostMatchesList(host, RESEARCH_EXACT_HOSTS)) return 'research';

  if (hostMatchesList(host, PUBLICATION_EXACT_HOSTS)) return 'publication';

  if (host.startsWith('blog.') || hostMatchesList(host, BLOG_EXACT_HOSTS)) {
    return 'blog';
  }

  return 'unknown';
}
