## 1. Transition model
- [ ] 1.1 Define a transition map: from-status -> to-status -> allowed roles
- [ ] 1.2 Mark DELIVERED and CANCELLED terminal

## 2. Enforcement
- [ ] 2.1 In `PATCH /api/orders/[id]`, validate the requested status change against the map before writing
- [ ] 2.2 Return 409 for illegal edges, 403 for role violations
- [ ] 2.3 Fold the existing buyer approve/cancel rule into the map

## 3. UI
- [ ] 3.1 Show only legal next-status actions for the viewer's role in the order views

## 4. Verification
- [ ] 4.1 Tests: each legal edge per role, skip rejected, backward rejected, terminal locked

## 5. Optional audit
- [ ] 5.1 Add `status_changed_at` (or a status-history table) and record transitions
