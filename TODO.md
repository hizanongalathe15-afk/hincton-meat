# TODO

## Backend TypeScript/Prisma fixes
- [ ] Rewrite `src/controllers/chatController.ts` to use `LiveChatMessage` (replace nonexistent `conversation`/`message` calls).
- [ ] Fix `src/controllers/optimizedProductController.ts` to align Prisma fields (`categoryId`, `isFeatured`, `stockQuantity`, etc) and resolve TS typing issues.
- [ ] Fix `src/models/User.ts`:
  - [ ] Correct Address creation/update mapping to Prisma `Address` fields (`addressLine1`, etc).
  - [ ] Replace `notificationSettings` usage with `UserSettings` model.

## Frontend TypeScript fixes
- [ ] Remove unused `t` / `logout` variables in buyer profile pages that fail `npx tsc --noEmit`.

## Verification
- [ ] Run `backend` typecheck: `cd backend && npx tsc --noEmit`
- [ ] Run `frontend` typecheck: `cd frontend && npx tsc --noEmit`

