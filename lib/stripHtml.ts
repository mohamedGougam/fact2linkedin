/**
 * Strip tags from search snippets (e.g. <strong>, <b>) so facts and posts stay plain text for LinkedIn.
 */
export function stripHtmlTags(input: string): string {
  return input
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"');
}
