## Why
Brokers assemble an order by hand-picking offer ids, with no help from the system. Yet inquiries and offers share the exact same shape vocabulary — grade, shape, width, height, thickness — plus a quantity (`barsRequested` vs `barsAvailable`). The data is already structured for matching, so the broker is doing by eye what the system could do precisely. This is the highest-leverage improvement to the core broker workflow and removes a class of mismatch errors (wrong grade, wrong dimensions).

## What Changes
- Add a read-only capability that, given an inquiry, returns the offers compatible with it.
- Compatibility is an exact match on grade, shape, width, height, and thickness.
- Results are ranked cheapest-first by raw `pricePerMeter` and annotated with how the offer's `barsAvailable` compares to the inquiry's `barsRequested`.
- Exclude offers already committed to an order (they are frozen).
- Surface suggestions in the broker's order-create flow; the broker still chooses what to link.

## Capabilities

### New Capabilities
- `match-suggestions`: given an inquiry, find and rank seller offers compatible with it, to assist brokers when composing an order.

## Impact
- New read-only API (e.g. `GET /api/inquiries/[id]/matches`), broker-only.
- New query joining `inquiry` and `offer` on the shape columns; reads `order_offer` to exclude committed offers.
- Broker order-create UI (`OrderFormDialog`) gains a suggestions panel.
- No schema changes. No change to how orders are created.
- Pairs with `order-inventory-tracking`: once per-offer committed quantity exists, exclusion should mean "no remaining bars" rather than "linked at all".
