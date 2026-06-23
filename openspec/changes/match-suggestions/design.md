## Context
Order composition is fully manual: the broker selects offer ids in `OrderFormDialog`. Inquiries and offers share five comparable columns (grade, shape, width, height, thickness) plus a bar count. There is no length field, so matching is on profile + grade only, not total meters.

## Goals / Non-Goals
**Goals:**
- Precisely surface offers that can fulfil an inquiry's profile.
- Keep the broker in control — suggest, never auto-link.

**Non-Goals:**
- Automatically creating orders.
- Fuzzy/tolerance matching or grade substitution.
- Multi-offer "basket" optimization to exactly cover a quantity (future).

## Decisions
- **Exact match, no tolerance.** Steel grade and section dimensions are categorical; a near-match is a wrong product. Width/height/thickness compare on the stored DECIMAL precision.
- **Exclude committed offers.** An offer linked to any order is frozen (order immutability), so it cannot back a new order; filter it out rather than show-and-disable.
- **Rank by raw price ascending.** The broker is sourcing cheapest stock; margin is applied later on the order, so ranking uses the seller price.
- **Quantity is advisory.** We flag whether a single offer covers `barsRequested`; we do not yet compute multi-offer combinations.

## Risks / Trade-offs
- Exact dimension matching may hide viable near-spec stock; acceptable for v1, revisit with tolerances if brokers ask.
- Once `order-inventory-tracking` lands, "committed" should mean "no remaining bars" rather than "linked at all"; this capability should adopt remaining-availability as its exclusion rule then.
