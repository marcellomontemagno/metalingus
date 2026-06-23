## Why
The order status enum has six values, but the only constraints today are role-based: a broker can set status "freely", which means a broker can jump `MATCHED → DELIVERED`, skipping approval, payment, and dispatch entirely. There is no definition of which transitions are legal, who performs each, or which states are terminal. The lifecycle is an enum, not a state machine — so the data can describe deals that never actually happened in that order.

## What Changes
- Define the legal status transition graph and validate every status change against it.
- Assign each transition to the role(s) allowed to perform it.
- Make `DELIVERED` and `CANCELLED` terminal (no transitions out).
- Reject illegal jumps and backward moves.
- (Optional) Record when each transition happened for an audit trail.

## Capabilities

### Modified Capabilities
- `orders`: status changes are constrained to a defined transition graph with per-transition role rules, replacing the broker's unrestricted status freedom.

## Impact
- `PATCH /api/orders/[id]` gains a transition guard (legal edge + role) ahead of the existing status update.
- The current "buyer may approve/cancel a MATCHED order" rule becomes two edges in the graph.
- UI shows only the legal next actions for the viewer's role.
- Optional schema: a `status_changed_at` column or an order status-history table (migration).
