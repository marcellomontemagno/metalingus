## MODIFIED Requirements

### Requirement: Broker creates an order by matching
The system SHALL allow only brokers to create an order, which links exactly one inquiry to one or more offers, recording for each link the number of bars drawn from that offer. New orders SHALL start with status `MATCHED`, default `margin` 0, and be owned by the creating broker. The order row and its `order_offer` links SHALL be written in a single transaction, which SHALL fail if any offer would be committed beyond its remaining availability.

#### Scenario: Broker matches an inquiry to offers with quantities
- **WHEN** a broker POSTs an order linking offers with a bar quantity for each
- **THEN** the order and its quantified links are committed atomically and returned with status `201`

#### Scenario: Order requires at least one offer
- **WHEN** a broker POSTs an order with an empty `offerIds`
- **THEN** the system responds `400`

#### Scenario: Oversell is rejected
- **WHEN** a broker submits an order or edit that would draw more bars from an offer than its remaining availability
- **THEN** the transaction is rejected and no links are written

## ADDED Requirements

### Requirement: Committed bars release on cancellation
The system SHALL exclude orders in status `CANCELLED` from an offer's committed bars, returning that capacity to remaining availability.

#### Scenario: Cancelling frees capacity
- **WHEN** an order that drew bars from an offer is moved to `CANCELLED`
- **THEN** those bars no longer count against the offer's remaining availability
