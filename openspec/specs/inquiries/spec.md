# Inquiries

## Purpose
Let buyers describe the steel bars they need so brokers can match them against seller offers.

## Requirements

### Requirement: Inquiry data model
An inquiry SHALL capture `barsRequested` (positive integer), `grade`, `shape`, `width`, `height`, `thickness` (positive numbers), an optional `latestDeliveryDate`, optional `notes`, and the owning `userId`. The system SHALL reject payloads that violate these constraints with `400`.

#### Scenario: Invalid quantity
- **WHEN** a buyer submits an inquiry with `barsRequested` of 0 or negative
- **THEN** the system responds `400` with a validation message

### Requirement: Buyers create their own inquiries
The system SHALL allow only users holding the `buyer` role to create inquiries, and only for themselves. (See access-control: role-gated writes, ownership.)

#### Scenario: Buyer creates an inquiry
- **WHEN** a buyer POSTs a valid inquiry with their own `userId`
- **THEN** the inquiry is persisted and returned with status `201`

### Requirement: Buyers edit and delete their own inquiries
The system SHALL allow a buyer to update or delete an inquiry they own, unless it is linked to an order. (See access-control: order immutability.)

#### Scenario: Edit unlinked inquiry
- **WHEN** a buyer PATCHes an inquiry they own that no order references
- **THEN** the changes are persisted

#### Scenario: Acting on a non-owned inquiry
- **WHEN** a buyer deletes an inquiry id they do not own
- **THEN** the system responds `404 Not found`

### Requirement: Inquiry visibility
The system SHALL show all inquiries to brokers and only their own inquiries to buyers; sellers SHALL NOT see inquiries.

#### Scenario: Broker sees all
- **WHEN** a broker lists inquiries
- **THEN** every inquiry is returned

#### Scenario: Buyer sees own
- **WHEN** a buyer lists inquiries
- **THEN** only inquiries they own are returned
