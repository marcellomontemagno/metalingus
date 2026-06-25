## MODIFIED Requirements

### Requirement: Invite-only access
The system SHALL NOT auto-provision accounts from a magic-link sign-in; a person gains access only by accepting an organization invitation sent to their email address. Open sign-up is disabled outside the invitation flow.

#### Scenario: Unknown email cannot self-provision
- **WHEN** an email with no account and no pending invitation requests a magic link
- **THEN** no account is created and no session is granted

#### Scenario: Invitation grants access
- **WHEN** an invited email completes sign-in and accepts its organization invitation
- **THEN** an account is created and the user becomes a member of the inviting organization

## REMOVED Requirements

### Requirement: Stateless JWT sessions
**Reason**: Better Auth uses database-backed sessions; the next-auth JWT strategy is removed.
**Migration**: Sessions are persisted server-side (Better Auth `session` table) and identified by a signed session cookie. Existing JWT sessions are invalidated at cutover; users re-authenticate via a new magic link.

## ADDED Requirements

### Requirement: Database-backed sessions
The system SHALL persist sessions server-side via Better Auth and identify the current request through a signed session cookie, supporting server-side revocation and an active-organization claim.

#### Scenario: Authenticated request resolves identity
- **WHEN** a request carries a valid Better Auth session cookie
- **THEN** `getAuthContext()` resolves the user, their active organization, their member role, and any platform role

#### Scenario: Revoked session is rejected
- **WHEN** a session has been revoked server-side
- **THEN** subsequent requests presenting that session cookie are treated as unauthenticated
