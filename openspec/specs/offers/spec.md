# Offers

## Purpose
Let sellers publish the steel bar stock they have available, priced per meter, for brokers to match against buyer inquiries.

## Requirements

### Requirement: Offer data model
An offer SHALL capture `barsAvailable` and `barsPerBundle` (positive integers), `grade`, `shape`, `width`, `height`, `thickness`, `weightPerMeter`, `pricePerMeter` (positive numbers), a 3-letter `currency` (default EUR), optional `notes`, and the owning `userId`. The system SHALL reject violations with `400`.

#### Scenario: Invalid price
- **WHEN** a seller submits an offer with a non-positive `pricePerMeter`
- **THEN** the system responds `400` with a validation message

### Requirement: Sellers create their own offers
The system SHALL allow only users holding the `seller` role to create offers, and only for themselves.

#### Scenario: Seller creates an offer
- **WHEN** a seller POSTs a valid offer with their own `userId`
- **THEN** the offer is persisted and returned with status `201`

### Requirement: Sellers edit and delete their own offers
The system SHALL allow a seller to update or delete an offer they own, unless it is linked to an order. (See access-control: order immutability.)

#### Scenario: Editing a linked offer is blocked
- **WHEN** a seller edits an offer that is part of an order
- **THEN** the system responds `403 Forbidden`

### Requirement: Offer visibility and price masking
The system SHALL show all offers to brokers and only their own to sellers. Buyers SHALL see only offers linked to their own orders, and only at the marked-up price; the raw seller price and the margin SHALL NOT be exposed. (See access-control: margin privacy.)

#### Scenario: Seller sees own offers
- **WHEN** a seller lists offers
- **THEN** only offers they own are returned

#### Scenario: Buyer sees marked-up linked offers
- **WHEN** a buyer lists offers
- **THEN** only offers linked to their orders are returned, with `pricePerMeter` already marked up by the order margin
