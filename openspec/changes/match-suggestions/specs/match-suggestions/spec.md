## ADDED Requirements

### Requirement: Compatible offer matching
The system SHALL, given an inquiry, return the offers whose `grade`, `shape`, `width`, `height`, and `thickness` all equal the inquiry's, and SHALL exclude any offer already linked to an order.

#### Scenario: Exact match returned
- **WHEN** a broker requests matches for an inquiry
- **THEN** every returned offer has identical grade, shape, width, height, and thickness, and is not linked to any order

#### Scenario: Mismatched dimensions excluded
- **WHEN** an offer differs from the inquiry in any of grade, shape, width, height, or thickness
- **THEN** that offer is not returned

### Requirement: Suggestion ranking and quantity fit
The system SHALL rank suggested offers by ascending `pricePerMeter` and SHALL annotate each with whether its `barsAvailable` meets or exceeds the inquiry's `barsRequested`.

#### Scenario: Cheapest first
- **WHEN** multiple compatible offers exist
- **THEN** they are ordered from lowest `pricePerMeter` to highest

#### Scenario: Quantity sufficiency flagged
- **WHEN** a compatible offer has fewer `barsAvailable` than the inquiry's `barsRequested`
- **THEN** the offer is marked as insufficient on its own to fill the inquiry

### Requirement: Broker-only suggestions
The system SHALL restrict match suggestions to users holding the `broker` role.

#### Scenario: Non-broker denied
- **WHEN** a buyer or seller requests match suggestions
- **THEN** the system responds `403 Forbidden`
