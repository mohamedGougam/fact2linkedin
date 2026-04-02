/**
 * Typed errors from the search HTTP layer — safe user-facing messages only (no secrets, no response bodies).
 */

export type SearchUserErrorKind = 'network' | 'timeout' | 'http' | 'auth' | 'parse';

export class SearchUserError extends Error {
  readonly kind: SearchUserErrorKind;

  constructor(message: string, kind: SearchUserErrorKind) {
    super(message);
    this.name = 'SearchUserError';
    this.kind = kind;
  }
}

export function isSearchUserError(e: unknown): e is SearchUserError {
  return e instanceof SearchUserError;
}
