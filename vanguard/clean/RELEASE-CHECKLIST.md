# VanGuard Clean — production release checklist

## Code
- [x] Isolated Clean application
- [x] Resumable cleaning workflow
- [x] Pass / fail / N/A task results
- [x] Notes and photo evidence
- [x] Corrective-action issue creation
- [x] Client sign-off
- [x] Printable branded reports
- [x] Idempotent report snapshots
- [x] Stripe Checkout trial flow
- [x] Starter / Business / Pro plan selection
- [x] Monthly / annual billing selection support
- [x] Stripe subscription webhook
- [x] Subscription status UI
- [x] Subscription UI mounts after login as well as initial page load
- [x] Early-access waitlist
- [x] International defaults
- [x] Clean app has explicit `/clean` and `/clean/*` routes

## Supabase
Run the Clean schema and release migrations in order:
1. `vanguard-clean-schema.sql`
2. `clean-evidence-schema.sql`
3. `vanguard-clean-report.sql`
4. `clean-data-hardening.sql`

Verify:
- `clean_sites`
- `clean_checklists`
- `clean_checklist_items`
- `clean_records`
- `clean_record_items`
- `clean_issues`
- `clean_evidence`
- `clean_signoffs`
- `clean_report_snapshots`
- `clean_subscriptions`
- `clean_settings`

Confirm RLS is enabled and ordinary users cannot read another user's records.

## Netlify environment
Required for production billing/webhooks:
- `STRIPE_SECRET_KEY`
- `CLEAN_STRIPE_WEBHOOK_SECRET`
- `CLEAN_STRIPE_STARTER_MONTHLY_PRICE_ID`
- `CLEAN_STRIPE_STARTER_YEARLY_PRICE_ID`
- `CLEAN_STRIPE_BUSINESS_MONTHLY_PRICE_ID`
- `CLEAN_STRIPE_BUSINESS_YEARLY_PRICE_ID`
- `CLEAN_STRIPE_PRO_MONTHLY_PRICE_ID`
- `CLEAN_STRIPE_PRO_YEARLY_PRICE_ID`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

The browser must only receive the Supabase anon key, never the service-role key or Stripe secret.

## Stripe
Create six recurring prices:
- Starter: £9.99 monthly / £99.90 yearly
- Business: £24.99 monthly / £249.90 yearly
- Pro: £49.99 monthly / £499.90 yearly

Create a webhook pointing to:
`/.netlify/functions/clean-stripe-webhook`

Subscribe at minimum to:
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`

## End-to-end test
1. Create a fresh Clean account.
2. Start a trial with a test card.
3. Confirm Stripe Checkout requires a payment method and shows the 14-day trial.
4. Confirm the webhook creates `clean_subscriptions` with the selected plan.
5. Return to Clean and confirm the subscription panel shows the plan/trial.
6. Add a site.
7. Add/select a checklist.
8. Start a clean.
9. Record pass/fail/N/A results.
10. Add a note and photo evidence.
11. Complete the clean.
12. Enter client name and role for sign-off.
13. Open the generated report.
14. Confirm evidence, issues, sign-off and report number are present.
15. Refresh and confirm the completed record cannot be edited.
16. Confirm the report remains available after refresh.

## Launch gate
Do not merge PR #4 until the end-to-end test above passes against the real Supabase, Netlify and Stripe environments.
