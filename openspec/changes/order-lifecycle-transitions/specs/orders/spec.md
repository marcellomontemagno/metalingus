## MODIFIED Requirements

### Requirement: Broker edits are locked after MATCHED
The system SHALL let a broker change an order's status only along a legal transition (see "Order status transition graph"), and SHALL reject changes to its inquiry, margin, notes, or offer set once the status has left `MATCHED`.

#### Scenario: Broker advances one legal step
- **WHEN** a broker moves an `APPROVED` order to `PAID`
- **THEN** the status is updated

#### Scenario: Broker cannot skip states
- **WHEN** a broker moves a `MATCHED` order directly to `DELIVERED`
- **THEN** the system responds `409 Conflict` and the status is unchanged

#### Scenario: Broker cannot re-match after approval
- **WHEN** a broker changes the margin or offers of an order whose status is past `MATCHED`
- **THEN** the system responds `403 Forbidden`

## ADDED Requirements

### Requirement: Order status transition graph
The system SHALL permit only these transitions: `MATCHED → APPROVED` (owning buyer), `MATCHED → CANCELLED` (owning buyer or broker), `APPROVED → PAID` (broker), `APPROVED → CANCELLED` (broker), `PAID → DISPATCHED` (broker), `DISPATCHED → DELIVERED` (broker). `DELIVERED` and `CANCELLED` SHALL be terminal.

#### Scenario: Legal buyer transition
- **WHEN** the owning buyer moves a `MATCHED` order to `APPROVED`
- **THEN** the transition succeeds

#### Scenario: Illegal transition rejected
- **WHEN** any actor attempts a transition not in the graph (e.g. `PAID → MATCHED`)
- **THEN** the system responds `409 Conflict`

#### Scenario: Terminal state is final
- **WHEN** any actor attempts to change the status of a `DELIVERED` or `CANCELLED` order
- **THEN** the system responds `409 Conflict`
