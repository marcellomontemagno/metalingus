## Context
`order_offer (id, order_id, offer_id)` has no quantity and no uniqueness on `offer_id`. Orders draw "an offer" wholesale, conceptually. `offer.barsAvailable` is a static number never reconciled against what has been sold.

## Goals / Non-Goals
**Goals:**
- Make committed quantity explicit per order/offer link.
- Guarantee an offer is never committed beyond `barsAvailable` across live orders.

**Non-Goals:**
- Partial-shipment or per-bundle tracking.
- Backorders / waitlisting when capacity is exhausted.
- Maintaining a seller's stock as a separately mutable number.

## Decisions
- **Derive, don't decrement.** Keep `barsAvailable` as the seller-stated total and compute remaining = total − Σ committed (non-cancelled). Avoids a second source of truth and makes cancellation automatically restorative.
- **Quantity lives on `order_offer.bars`.** One new NOT NULL column; backfill existing links with the linked offer's `barsAvailable` (best-effort, preserves current behavior).
- **Capacity check inside the order transaction.** The existing `sql.transaction` gains a guard that re-reads committed totals; a violation aborts the whole transaction so links are all-or-nothing.
- **"Non-cancelled" defines live commitment.** Only `CANCELLED` releases capacity; every other status holds it.

## Risks / Trade-offs
- Concurrency: two simultaneous orders could each pass the check then jointly oversell. Mitigate with a row lock on the offer (`SELECT ... FOR UPDATE`) inside the transaction, or a post-insert assertion.
- Backfill is approximate for historical multi-order offers; acceptable given low/seed volume today.
