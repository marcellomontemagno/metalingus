## ADDED Requirements

### Requirement: Bar length
An offer SHALL record the length in meters of each bar (`length`, a positive number), so that a per-meter price resolves to a per-bar and per-line monetary amount.

#### Scenario: Length captured on create
- **WHEN** a seller creates an offer
- **THEN** a positive bar length in meters is required and stored

#### Scenario: Length drives totals
- **WHEN** an order line draws N bars from an offer of length L at marked-up price P per meter
- **THEN** the line total equals P × N × L
