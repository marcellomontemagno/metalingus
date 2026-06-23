# Access Control

## Purpose
Define the role model and the cross-cutting authorization guarantees every capability relies on: who may act, on whose data, and what commercial information each side may see. The defining guarantee is margin privacy — the broker's spread is the business model and must never leak.

## Requirements

### Requirement: Additive roles
The system SHALL support the roles `buyer`, `seller`, and `broker`, resolved server-side from `user_role`. A user MAY hold any combination of roles, and their permissions are the union of all roles held.

#### Scenario: Multi-role user
- **WHEN** a user holds both `buyer` and `seller`
- **THEN** they may post inquiries and offers, and they see the union of buyer- and seller-visible data

#### Scenario: User with no roles
- **WHEN** an authenticated user holds no roles
- **THEN** they receive empty result sets and may not create any entity

### Requirement: Role-gated writes
The system SHALL restrict mutations by role: only buyers create or modify inquiries, only sellers create or modify offers, only brokers create orders, and order status changes are limited to brokers and the owning buyer.

#### Scenario: Wrong role is rejected
- **WHEN** a seller attempts to create an inquiry
- **THEN** the system responds `403 Forbidden`

### Requirement: Ownership enforcement
The system SHALL ensure a user can only create or modify entities they own; an entity's `userId` may not be set to, or reassigned to, another user.

#### Scenario: Cannot act on another user's behalf
- **WHEN** a buyer submits an inquiry whose `userId` is not their own
- **THEN** the system responds `403 Forbidden`

### Requirement: Order immutability for linked entities
The system SHALL prevent editing or deleting any inquiry or offer that is linked to an order.

#### Scenario: Locked inquiry
- **WHEN** a buyer edits or deletes an inquiry that an order references
- **THEN** the system responds `403 Forbidden`

#### Scenario: Locked offer
- **WHEN** a seller edits or deletes an offer linked via `order_offer`
- **THEN** the system responds `403 Forbidden`

### Requirement: Margin privacy
The system SHALL withhold the broker margin and the raw seller price from anyone who is not a broker. Buyers and sellers SHALL receive an order's `margin` as null, and buyers SHALL see offer prices only as the marked-up `price_per_meter * (1 + margin)`.

#### Scenario: Buyer never sees the spread
- **WHEN** a buyer reads an order linked to their inquiry
- **THEN** the order's `margin` is null

#### Scenario: Buyer sees marked-up price only
- **WHEN** a buyer reads an offer linked to one of their orders
- **THEN** the returned `pricePerMeter` is margin-inclusive and the raw seller price is never sent
