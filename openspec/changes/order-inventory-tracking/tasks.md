## 1. Schema
- [ ] 1.1 Migration: add `bars INT NOT NULL` to `order_offer`
- [ ] 1.2 Backfill existing links from the linked offer's `barsAvailable`

## 2. Capacity logic
- [ ] 2.1 Add a query for an offer's committed bars (excluding CANCELLED orders)
- [ ] 2.2 Add a capacity guard inside the order create transaction (lock the offer row)
- [ ] 2.3 Apply the same guard to order edits that change links or quantities

## 3. API surface
- [ ] 3.1 Accept per-offer `bars` in `POST /api/orders` and `PATCH /api/orders/[id]`
- [ ] 3.2 Compute and return remaining availability on offer reads (broker)

## 4. Verification
- [ ] 4.1 Tests: oversell rejected, exact-fill accepted, cancellation frees capacity, concurrent oversell blocked
