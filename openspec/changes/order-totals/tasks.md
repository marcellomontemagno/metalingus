## 1. Schema
- [ ] 1.1 Migration: add `length_m DECIMAL(8,2) NOT NULL` to `offer` (+ backfill default, flagged for review)
- [ ] 1.2 Add `length` to the offer zod schema and offer form

## 2. Totals computation
- [ ] 2.1 Compute line totals (marked-up price × bars × length) and a grand total on order reads
- [ ] 2.2 Extend order sanitization so buyers/sellers get marked-up totals only and brokers get the cost/margin breakdown

## 3. Currency guard
- [ ] 3.1 Reject order create/edit when linked offers span multiple currencies

## 4. UI
- [ ] 4.1 Show the grand total in the buyer's order view; show the breakdown in the broker's `OrderViewDialog`

## 5. Verification
- [ ] 5.1 Tests: line/grand total math, buyer sees only marked-up total, broker sees breakdown, mixed-currency rejected
