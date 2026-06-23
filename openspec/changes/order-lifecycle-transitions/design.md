## Context
`PATCH /api/orders/[id]` lets a broker set any status, and lets the owning buyer move a `MATCHED` order to `APPROVED`/`CANCELLED`. There is no transition table; the broker path is unguarded on sequence.

## Goals / Non-Goals
**Goals:**
- A single source of truth for legal transitions and who may perform them.
- Reject illegal/terminal transitions deterministically.

**Non-Goals:**
- Payment capture, logistics, or notifications behind PAID/DISPATCHED/DELIVERED.
- Seller-driven transitions (sellers remain read-only for now).
- Arbitrary admin overrides.

## Decisions
- **Explicit transition map** `{from -> {to -> roles}}` evaluated before any write; the buyer approve/cancel rule becomes two edges, no longer special-cased.
- **Linear happy path** MATCHED → APPROVED → PAID → DISPATCHED → DELIVERED, with CANCELLED reachable from MATCHED (buyer/broker) and APPROVED (broker). No un-cancel, no backward edges.
- **409 for illegal edges, 403 for wrong role.** Distinguish "not a legal move" from "not allowed to make this move".
- **Audit is optional, additive.** A `status_changed_at` timestamp (or a history table) can be added without affecting the guard; deferred unless needed.

## Risks / Trade-offs
- A stricter graph removes the broker's ability to correct mistakes by jumping states; mitigate via CANCELLED + new order, or a future admin override.
- If sellers later need to mark dispatch, the map gains a seller edge — the structure already supports it.
