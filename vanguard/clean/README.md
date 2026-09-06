# VanGuard Clean

Commercial cleaning compliance MVP.

## Positioning

**Prove your cleaning was done.**

VanGuard Clean is intentionally separate from the existing Food app during MVP development so Food remains stable.

## MVP workflow

Customer/site → checklist → cleaner completes → evidence/issues → review/sign-off → report.

## Planned modules

- Dashboard
- Customers & sites
- Checklist templates
- Cleaning records
- Photo evidence
- Issues & corrective actions
- Client sign-off
- PDF reports
- Trial/subscription

## Database

`vanguard-clean-schema.sql` is additive to the existing VanGuard Supabase schema and uses separate `clean_*` tables with RLS.
