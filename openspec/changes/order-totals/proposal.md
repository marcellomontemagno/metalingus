## Why
Margin privacy is solved at the unit level — buyers already see offers at the marked-up `pricePerMeter` — but there is no *order total*. Nobody can see what a deal actually costs: no per-offer line total, no grand total, nothing for a buyer to review before approving or for a broker to see their margin in money. The economic summary of the order, the whole point of the transaction, is missing.

## What Changes
- Compute a monetary total for each order from its linked offers.
- Introduce a bar **length** (meters) so that meters — and therefore price — are knowable: meters for a line = bars drawn × bar length.
- Line total = marked-up `pricePerMeter` × meters; order total = sum of line totals.
- Show buyers the margin-inclusive grand total only; show brokers the breakdown (seller cost, margin amount, sell total).
- Constrain an order's offers to a single currency so totals are summable.

## Capabilities

### Modified Capabilities
- `orders`: an order now computes and exposes line and grand totals, honoring margin privacy.
- `offers`: an offer gains a bar `length` so per-meter prices resolve to per-bar and per-line money.

## Impact
- Schema: add `length_m DECIMAL` to `offer` (migration + backfill). Totals stay derived (no order_total column).
- Order reads compute totals; buyer responses expose only the marked-up grand total, broker responses include the cost/margin breakdown.
- Enforce single-currency-per-order at order create/edit.
- Depends on per-line quantity from `order-inventory-tracking` for "bars drawn"; absent that, a line uses the offer's full `barsAvailable`.
