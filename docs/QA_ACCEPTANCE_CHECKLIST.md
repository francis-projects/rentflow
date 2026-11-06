# RentFlow MVP acceptance and pre-deployment checklist

This checklist is deliberately not marked complete until the application is run and tested locally. The GitHub repository and Supabase project have been updated, but no production deployment has been performed.

## Implemented in the repository
- [x] Supabase SSR browser and server clients
- [x] Email/password registration and login actions
- [x] Email confirmation callback route
- [x] Automatic organisation and owner membership bootstrap trigger
- [x] Organisation-scoped workspace context
- [x] Property and unit registration screens
- [x] Owner directory and property ownership percentage assignments
- [x] Tenant registration
- [x] Lease creation and unit occupancy synchronisation
- [x] Unique active lease per unit constraint
- [x] Monthly rent charge generation RPC
- [x] Transaction-safe payment recording and optional charge allocation RPC
- [x] Printable payment receipt
- [x] Expense recording
- [x] Portfolio dashboard and summary reports
- [x] Role-aware row-level security policies
- [x] CI workflow for lint, TypeScript, and production build
- [x] Generated database TypeScript types

## Must be tested locally before any deployment
- [ ] npm install completes successfully
- [ ] npm run lint passes
- [ ] npm run typecheck passes
- [ ] npm run build passes
- [ ] New user can register and receive confirmation email
- [ ] Email confirmation returns to the application
- [ ] Login, logout and session refresh work
- [ ] Workspace and owner membership are created exactly once
- [ ] A user from a second organisation cannot read or alter the first organisation's data
- [ ] Owner, admin, manager, accountant and staff permissions match the intended matrix
- [ ] Property and unit creation works; duplicate unit codes are rejected
- [ ] An active lease makes a unit occupied
- [ ] A second active lease for the same unit is rejected
- [ ] Lease end/termination makes the unit vacant when no other active lease exists
- [ ] Monthly charge generation is idempotent
- [ ] Partial payments update charge balances correctly
- [ ] Payment allocations cannot exceed a charge or the payment amount
- [ ] Unallocated payments are visible and reconcilable
- [ ] Receipt contents match the posted payment
- [ ] Expenses are isolated by organisation
- [ ] Reports reconcile against the underlying rent ledger and expenses
- [ ] Database backup and restore procedure is proven before production use

## Known MVP limitations / follow-up work
- Payment reversal and correction workflow is not yet implemented. Payments are intentionally immutable through direct client operations.
- Payment form currently supports one charge allocation per payment; multi-charge split allocation and allocation editing need a dedicated workflow.
- Owner statement generation and downloadable PDF statements remain to be built.
- Tenant-facing portal, reminders, maintenance tickets, document uploads and recurring notifications remain future modules.
- Staff invitations and organisation member management need an audited owner/admin workflow.
- Premium AI analysis is not implemented. It must consume verified ledger data and must never calculate or alter authoritative balances.
- No live payment gateway integration is enabled. Mobile money is currently recorded as a payment method with a reference.
- Security advisor reports two intentional SECURITY DEFINER RPC warnings: monthly charge generation and payment posting. Both validate organisation membership and are callable only by authenticated users. Review their grants and test authorisation before launch.

## Deployment gate
Do not deploy to production until the local checks above pass, cross-organisation isolation and role tests pass, payment ledger scenarios reconcile, email delivery is configured, backups are tested, and the known limitations are accepted or completed for the intended launch scope.