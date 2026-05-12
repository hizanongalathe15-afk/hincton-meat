# TODO Step 2 (controllers exports + CartModel contract)

- [x] Update `src/controllers/index.ts` to export `*Controller` namespaces/objects with method names expected by `src/routes/*.ts`.

- [ ] Ensure `routes/coupons.ts`, `dashboard.ts`, `fileUpload.ts`, `payments.ts`, `reviews.ts`, `search.ts`, `userSessions.ts`, `users.ts` can import the expected `XController.*` symbols.
- [ ] Update `src/models/Cart.ts` to add missing methods referenced by `src/controllers/cartController.ts` (findBySessionId, addItem, updateItem, removeItem, clearCart, applyCoupon, removeCoupon, updateShippingInfo, getCartSummary).
- [ ] Run `npx tsc --noEmit` in `backend/` to confirm errors reduced.

