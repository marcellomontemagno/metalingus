## REMOVED Requirements

### Requirement: Additive roles
**Reason**: The single global, additive role list (buyer/seller/broker per user) is replaced by a three-dimensional, organization-scoped model.
**Migration**: `buyer`/`seller` become a Business **type** on the organization (see `organizations`); `broker` becomes a **platform** role on the user (not organization-scoped); `owner`/`admin`/`member` become Better Auth member roles. Existing users are migrated into a Business whose type reflects their former roles, and brokers are flagged at the platform level.

## ADDED Requirements

### Requirement: Authorization dimensions
The system SHALL derive a request's permissions from three independent dimensions: the active organization's **business type** (whether it may buy and/or sell), the actor's **member role** within that organization (`owner`/`admin`/`member`), and the user's **platform role** (`broker` or none). An action is permitted only when every applicable dimension allows it.

#### Scenario: Composed check passes
- **WHEN** a writing member of a buyer-type organization posts an inquiry
- **THEN** the action is allowed because the business type, member role, and absent platform restriction all permit it

#### Scenario: Platform-only action is gated
- **WHEN** a user without the `broker` platform role attempts to create an order
- **THEN** the system responds `403 Forbidden`

## MODIFIED Requirements

### Requirement: Role-gated writes
The system SHALL gate mutations by business type and member role rather than a global role: a member may create or modify an inquiry only if their active organization's type includes **buyer**, and an offer only if it includes **seller**; only a user with the **broker** platform role creates orders; order status changes are limited to the broker and a writing member of the owning buyer organization. Members whose role does not permit writes SHALL be denied.

#### Scenario: Wrong business type is rejected
- **WHEN** a member of a seller-only organization attempts to create an inquiry
- **THEN** the system responds `403 Forbidden`

#### Scenario: Insufficient member role is rejected
- **WHEN** a read-only member attempts to create an offer for their organization
- **THEN** the system responds `403 Forbidden`

### Requirement: Ownership enforcement
The system SHALL scope create and modify rights to the actor's active organization: a member may create entities owned by that organization and modify entities it owns, and SHALL NOT act on entities owned by another organization. An entity's owning organization is taken from the actor's active organization and may not be reassigned.

#### Scenario: Members share their organization's entities
- **WHEN** any writing member of the owning organization edits one of its unlinked inquiries
- **THEN** the edit is allowed

#### Scenario: Cannot act on another organization's entity
- **WHEN** a member submits a change to an entity owned by a different organization
- **THEN** the system responds `403 Forbidden`
