## Why
`order_offer` records which offers belong to an order but not *how many bars* are drawn from each, and `offer_id` is not unique across orders. As a result the same physical stock can be sold to multiple orders, and an offer can be committed far beyond its `barsAvailable`, with nothing in the system to stop it. For a marketplace that moves real material and money, silent oversell/double-sell is a correctness bug, not a missing nicety.

## What Changes
- Record the quantity of bars each order draws from each linked offer (`order_offer.bars`).
- Treat `offer.barsAvailable` as capacity and derive *remaining* availability = `barsAvailable` minus bars committed by non-cancelled orders.
- Reject order creation or edits that would commit more bars of an offer than remain.
- Expose remaining availability so brokers (and match suggestions) can see what is still sellable.

## Capabilities

### Modified Capabilities
- `orders`: order creation and editing now carry a per-offer bar quantity and are rejected if they oversell an offer.
- `offers`: an offer now exposes remaining (uncommitted) availability alongside its total `barsAvailable`.

## Impact
- Schema: add `bars INT NOT NULL` to `order_offer` (migration + backfill of existing links).
- `POST /api/orders` and `PATCH /api/orders/[id]` accept per-offer quantities and run a capacity check inside the existing transaction.
- Offer reads compute remaining availability.
- Pairs with `match-suggestions` (flag/exclude offers with no remaining bars) and `order-totals` (line quantity feeds totals).
- Cancelled orders release their committed bars.
