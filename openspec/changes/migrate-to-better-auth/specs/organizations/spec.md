## ADDED Requirements

### Requirement: Businesses are organizations
The system SHALL model a Business as a Better Auth organization that one or more users operate as members. A user MAY belong to more than one organization and acts within a single **active** organization per session.

#### Scenario: Operating a business
- **WHEN** a member with an active organization makes a request
- **THEN** the request acts on behalf of that organization

#### Scenario: Switching active organization
- **WHEN** a user who belongs to multiple organizations selects a different one
- **THEN** subsequent requests act on behalf of the newly selected organization

### Requirement: Membership and member roles
The system SHALL assign each member a role of `owner`, `admin`, or `member`. The organization creator is the initial `owner`. The last `owner` SHALL NOT be removed or demoted until ownership is transferred to another member.

#### Scenario: Creator becomes owner
- **WHEN** a Business is created
- **THEN** the creating user is recorded as its `owner`

#### Scenario: Last owner is protected
- **WHEN** an attempt is made to remove or demote the only `owner`
- **THEN** the system rejects it until another member is promoted to `owner`

### Requirement: Email invitations
The system SHALL onboard new members by emailing an invitation (via Resend) that only the invited address may accept, and invitations SHALL expire. Accepting a valid invitation makes the invitee a member with the invited role.

#### Scenario: Invite and accept
- **WHEN** an `owner` or `admin` invites an email and that email accepts before expiry
- **THEN** the invitee becomes a member of the organization with the invited role

#### Scenario: Wrong recipient cannot accept
- **WHEN** an account whose email differs from the invited address attempts to accept the invitation
- **THEN** the system rejects the acceptance

### Requirement: Business type
The system SHALL record whether an organization may act as a **buyer**, a **seller**, or both, and this type SHALL determine which marketplace actions its members may take (enforced by access-control).

#### Scenario: Type gates capability
- **WHEN** a member of a buyer-only organization views the available marketplace actions
- **THEN** only buyer actions (posting inquiries) are offered

### Requirement: Organization-scoped resources
Inquiries, offers, and orders SHALL be owned by an organization and recorded with the creating member. They SHALL be visible to that organization's members and to the broker, and SHALL NOT be visible to unrelated organizations. Margin privacy is unchanged.

#### Scenario: Members see their organization's resources
- **WHEN** a member lists inquiries
- **THEN** the result includes inquiries owned by their active organization and excludes other organizations'

#### Scenario: Broker sees across organizations
- **WHEN** the broker lists inquiries
- **THEN** the result includes inquiries from every organization

### Requirement: Teams
An organization MAY group its members into teams. Teams organize members and SHALL NOT by themselves grant marketplace permissions, which remain governed by business type and member role.

#### Scenario: Team membership does not change authority
- **WHEN** an organization creates a team and adds existing members to it
- **THEN** those members belong to the team without any change to their organization role or permissions
