// Test-controlled auth session. The real getAuthContext() reads this through the
// mocked @/auth.auth() (see preload.ts), then resolves the user + roles from pglite.
type Session = { user: { email: string } } | null;

let session: Session = null;

export function getSession(): Session {
  return session;
}

// Act as an already-created user (by email).
export function asUser(email: string): void {
  session = { user: { email } };
}

export function asAnon(): void {
  session = null;
}
