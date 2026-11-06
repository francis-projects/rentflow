# RentFlow

Rental operations, rent collection records and owner reporting for independent property managers.

**Initial market:** Uganda  
**Product type:** Standalone, mobile-first rental management SaaS  
**Status:** Foundation / MVP development

## MVP scope

- Organisation workspaces and role-based access
- Properties, units and owners
- Tenants and leases
- Rent charges and tenant ledgers
- Full and partial payment recording
- Receipts and arrears dashboard
- Property expenses and owner reporting

Premium AI features will be added only after the core ledger is reliable. All financial calculations remain deterministic application logic.

## Technology

- Next.js App Router, React and TypeScript
- Supabase Auth and PostgreSQL
- Database-enforced Row Level Security
- Responsive web application / PWA

## Local development

1. Install Node.js 20+ and npm.
2. Copy `.env.example` to `.env.local` and fill in the Supabase values.
3. Run `npm install`.
4. Run `npm run dev`.
5. Open http://localhost:3000.

## Environment variables

See `.env.example`. Never expose a Supabase service-role key in browser code or commit secrets.

## Database

The initial migration is in `supabase/migrations/`. Review and apply it to a development Supabase project first. Do not use real tenant or payment data until RLS policies and access tests have been reviewed.

## Development principles

- Organisation membership is the tenant boundary.
- The database is the source of truth for access control.
- Store money in integer amounts, never floating-point values.
- Payment posting, allocation, reversals and adjustments must be auditable and transaction-safe.
- AI is optional, premium-gated and never authoritative for balances.
