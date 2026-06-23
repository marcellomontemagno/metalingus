## ADDED Requirements

### Requirement: Remaining offer availability
The system SHALL derive an offer's remaining availability as its `barsAvailable` minus the bars committed to it by all non-cancelled orders, and SHALL expose this remaining figure to brokers.

#### Scenario: Remaining reflects commitments
- **WHEN** an offer with 100 `barsAvailable` is linked to a non-cancelled order drawing 30 bars
- **THEN** its remaining availability is reported as 70

#### Scenario: Fully committed offer
- **WHEN** all of an offer's bars are committed to non-cancelled orders
- **THEN** its remaining availability is 0
