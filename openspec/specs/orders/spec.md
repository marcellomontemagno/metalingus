# Orders

## Purpose
Let brokers turn a buyer inquiry into a deal by matching it to one or more seller offers, applying a margin, and shepherding the result through a fulfillment lifecycle — while keeping the margin private.

## Requirements

### Requirement: Broker creates an order by matching
The system SHALL allow only brokers to create an order, which links exactly one inquiry to one or more offers. New orders SHALL start with status `MATCHED`, default `margin` 0, and be owned by the creating broker. The order row and its `order_offer` links SHALL be written in a single transaction.

#### Scenario: Broker matches an inquiry to offers
- **WHEN** a broker POSTs an order with an `inquiryId` and at least one offer id
- **THEN** the order and its offer links are committed atomically and returned with status `201`

#### Scenario: Order requires at least one offer
- **WHEN** a broker POSTs an order with an empty `offerIds`
- **THEN** the system responds `400`

### Requirement: Order status lifecycle
An order SHALL carry a status drawn from {MATCHED, APPROVED, PAID, DISPATCHED, DELIVERED, CANCELLED}.

#### Scenario: Default status
- **WHEN** an order is created
- **THEN** its status is `MATCHED`

### Requirement: Broker edits are locked after MATCHED
The system SHALL let a broker change an order's status at any time, but SHALL reject changes to its inquiry, margin, notes, or offer set once the status has left `MATCHED`.

#### Scenario: Broker re-matches while MATCHED
- **WHEN** a broker edits the offer set of a `MATCHED` order
- **THEN** the links are replaced and persisted

#### Scenario: Broker cannot re-match after approval
- **WHEN** a broker changes the margin or offers of an order whose status is past `MATCHED`
- **THEN** the system responds `403 Forbidden`

### Requirement: Buyer may approve or cancel their matched order
The system SHALL let the owning buyer (the inquiry's owner) move a `MATCHED` order to `APPROVED` or `CANCELLED`, and nothing else. Sellers SHALL be read-only on orders.

#### Scenario: Buyer approves
- **WHEN** the owning buyer sets a `MATCHED` order to `APPROVED`
- **THEN** the status is updated

#### Scenario: Buyer cannot advance further
- **WHEN** the owning buyer tries to set their order to `PAID`
- **THEN** the system responds `403 Forbidden`

### Requirement: Order visibility
The system SHALL show all orders to brokers, orders tied to their own inquiries to buyers, and orders linking their own offers to sellers.

#### Scenario: Seller sees orders using their offers
- **WHEN** a seller lists orders
- **THEN** only orders that link at least one of their offers are returned

### Requirement: Margin is broker-only
The system SHALL null an order's `margin` for any reader who is not a broker. (See access-control: margin privacy.)

#### Scenario: Non-broker reads order
- **WHEN** a buyer or seller reads an order
- **THEN** its `margin` is null
