## 1. Matching query
- [ ] 1.1 Write a SQL query selecting offers matching an inquiry on grade/shape/width/height/thickness, excluding offers present in `order_offer`
- [ ] 1.2 Order results by `pricePerMeter` ascending

## 2. API
- [ ] 2.1 Add broker-only `GET /api/inquiries/[id]/matches` returning compatible offers in store-shaped form
- [ ] 2.2 Annotate each offer with quantity sufficiency vs `barsRequested`

## 3. Broker UI
- [ ] 3.1 Add a suggestions panel to `OrderFormDialog` that lists matches and lets the broker add them to the order
- [ ] 3.2 Show the quantity-fit indicator per suggestion

## 4. Verification
- [ ] 4.1 Tests: exact match included, mismatches excluded, committed offers excluded, ranking order, role gating
