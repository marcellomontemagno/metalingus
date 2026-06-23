## Context
Pricing is per meter (`pricePerMeter`, `weightPerMeter`), but no field records how long a bar is, so total meters — and thus money — cannot be computed. Each offer also carries its own `currency`. The marked-up unit price already reaches buyers via the offers endpoint; only aggregation is missing.

## Goals / Non-Goals
**Goals:**
- A clear, correct monetary total per order, privacy-preserving by audience.
- The minimum data addition needed to compute it (bar length).

**Non-Goals:**
- Taxes, shipping, discounts, or currency conversion.
- Weight-based pricing (`weightPerMeter` stays informational).

## Decisions
- **Length on the offer.** A seller sells bars of a definite length; that is a property of the stock, not the deal. Length-per-order-line was rejected — it would let the same stock claim different lengths.
- **Totals are derived, never stored.** Compute on read from offers + links + margin; no `order_total` column to drift.
- **Single currency per order.** Summing mixed currencies is meaningless without FX, which is out of scope; enforce one currency per order instead.
- **Audience-shaped numbers.** Reuse the margin-privacy split: buyer/seller get marked-up totals only; broker gets cost, margin amount, and sell total. This extends `sanitizeOrder` from "null the margin" to "null the cost breakdown".

## Risks / Trade-offs
- Adding required `length` needs a backfill for existing offers (use a sensible default, e.g. 6m, flagged for review).
- Deriving on every read is fine at current volume; memoize if order reads get hot.
- The single-currency constraint may annoy brokers sourcing across currencies; revisit with FX if needed.
