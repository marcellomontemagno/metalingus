# Authentication

## Purpose
Control who can reach metalingus. Access is invite-only and passwordless: users sign in with an emailed magic link, sessions are stateless JWTs, and every route is protected unless explicitly public.

## Requirements

### Requirement: Passwordless email sign-in
The system SHALL authenticate users with email magic links via the NextAuth Resend provider, and SHALL NOT offer password or social login.

#### Scenario: Existing user requests a link
- **WHEN** a known user submits their email on `/auth/signin`
- **THEN** the system emails a magic link and shows the verify-request page at `/auth/verify`

#### Scenario: Completing the link signs the user in
- **WHEN** a user opens a valid, unexpired magic link
- **THEN** the verification token is consumed and a session is established

### Requirement: Invite-only access
The system SHALL NOT create user accounts automatically; only emails that already exist in the `user` table can authenticate.

#### Scenario: Unknown email cannot gain access
- **WHEN** an email with no matching `user` row completes the magic-link flow
- **THEN** no account is created (the adapter omits `createUser`) and no session is granted

### Requirement: Stateless JWT sessions
The system SHALL represent authenticated state as JWT sessions rather than database-backed sessions.

#### Scenario: Identity resolvable per request
- **WHEN** a request carries a valid session
- **THEN** server code can resolve the current user and roles via `getAuthContext()`

### Requirement: Protected-by-default routing
The system SHALL treat every route as protected except the home page (`/`), `/auth/*` pages, and NextAuth endpoints (`/api/auth/*`).

#### Scenario: Unauthenticated page request
- **WHEN** a signed-out visitor requests a protected page
- **THEN** the system redirects them to `/auth/signin`

#### Scenario: Unauthenticated API request
- **WHEN** a signed-out client calls a protected `/api/*` route
- **THEN** the system responds `401 Unauthorized` without redirecting
