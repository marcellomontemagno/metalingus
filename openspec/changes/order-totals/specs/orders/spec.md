## ADDED Requirements

### Requirement: Order totals
The system SHALL compute, for each order, a line total per linked offer (marked-up `pricePerMeter` × bars drawn × bar length) and a grand total that is their sum. Totals SHALL honor margin privacy: buyers and sellers receive only margin-inclusive figures, while brokers additionally receive the underlying seller cost and the margin amount.

#### Scenario: Buyer sees the marked-up grand total
- **WHEN** the owning buyer reads an order
- **THEN** the order includes a grand total computed at the marked-up price, with no raw cost or margin amount

#### Scenario: Broker sees the breakdown
- **WHEN** a broker reads an order
- **THEN** the order includes seller cost, margin amount, and sell total per line and overall

### Requirement: Single currency per order
The system SHALL reject an order whose linked offers do not share a single `currency`, so that line totals are summable.

#### Scenario: Mixed currencies rejected
- **WHEN** a broker links offers denominated in different currencies to one order
- **THEN** the system responds `400`
