# TODO (TypeScript compile fixes)

## Step 1: Contract alignment (arrays vs objects, missing methods)
- [x] Fix `src/controllers/dashboardController.ts` to match return types (arrays vs objects) for dashboard endpoints.
- [ ] Fix `src/controllers/paymentController.ts` to stop calling missing `PaymentModel.findAll` (implement `findAll` in model or switch to existing model methods).
- [ ] Fix `src/controllers/searchController.ts` to match model return shapes/signatures.
- [ ] Fix `src/controllers/userSessionController.ts` to match `UserSessionModel` actual method names (or implement missing wrapper methods).

## Step 2: Prisma field/type mismatches
- [ ] Fix `src/middleware/apiKey.ts` Prisma field usage to match `schema.prisma`.
- [ ] Fix `src/middleware/rateLimiter.ts` retryAfter type (Date -> number).
- [ ] Fix `src/middleware/errorHandler.ts` / `logger.ts` create payload fields (code/statusCode/details).
- [ ] Fix `src/middleware/userActivityTracker.ts` calls to missing model methods.

## Step 3: Analytics + Coupon model/schema alignment
- [ ] Fix `src/models/Analytics.ts` (duplicate identifiers, wrong where/orderBy/include fields).
- [ ] Fix `src/models/Coupon.ts` Decimal handling and return typing.

## Step 4: Routes referencing missing exports
- [ ] Fix `src/routes/index.ts` (req.apiVersion typing).
- [ ] Fix `src/routes/payments.ts` missing controller exports (either export or update router).
- [ ] Fix `src/routes/reviews.ts` missing controller exports.

## Validation
- [ ] Run `cd backend && npx tsc --noEmit` until 0 errors.

