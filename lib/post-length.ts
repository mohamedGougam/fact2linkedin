/** How much template text wraps around each fact (still deterministic). */
export type PostLength = 'short' | 'medium' | 'long';

export const POST_LENGTHS: PostLength[] = ['short', 'medium', 'long'];

export function isPostLength(value: unknown): value is PostLength {
  return typeof value === 'string' && (POST_LENGTHS as string[]).includes(value);
}
