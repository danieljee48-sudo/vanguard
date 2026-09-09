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
- [x] Checkout authenticates the signed-in Supabase user server-side; browser-supplied user IDs are not trusted
- [x] Starter / Business / Pro plan selection
- [x] Monthly / annual billing selection support
- [x] Stripe subscription webhook
- [x] Subscription status UI
- [x] Subscription UI mounts after login as well as initial page load
- [x] Early-access waitlist
- [x] International defaults
- [x] Clean app has explicit `/clean` and `/clean/*` routes
- [x] Stripe Node dependency declared in `package.json`

## Supabase
Run the canonical Clean migrations in this order:
1. `vanguard-clean-schema.sql` — core operational tables
2. `vanguard-clean-international-schema.sql` — settings, `clean_evidence`, private evidence bucket and regional template catalogue
3. `vanguard-clean-billing.sql` — subscriptions and entitlement helper
4. `vanguard-clean-report.sql` — persistent report snapshots
5. `clean-data-hardening.sql` — uniqueness and operational indexes

`clean-evidence-schema.sql` and `vanguard-clean-release-hardening.sql` are earlier/legacy additive migrations and are not required when provisioning a fresh Clean database with the canonical sequence above.

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
- `clean_template_catalog`

Confirm RLS is enabled and ordinary users cannot read another user's records. Confirm the `clean-evidence` storage bucket is private and a user cannot read another user's object path.

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

The browser must only receive the Supabase anon key, never the service-role key or Stripe secret. The checkout function validates the user's bearer token against Supabase before creating a Stripe session.

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
2. Start a trial with a Stripe test card.
3. Confirm Checkout requires a payment method and shows the 14-day trial.
4. Confirm an unauthenticated request to `clean-create-checkout` returns 401.
5. Confirm the webhook creates `clean_subscriptions` for the authenticated user and selected plan.
6. Return to Clean and confirm the subscription panel shows the plan/trial.
7. Add a site.
8. Add/select a checklist.
9. Start a clean.
10. Record pass/fail/N/A results.
11. Add a note and photo evidence.
12. Complete the clean.
13. Enter client name and role for sign-off.
14. Open the generated report.
15. Confirm evidence, issues, sign-off and report number are present.
16. Refresh and confirm the completed record cannot be edited.
17. Confirm the report remains available after refresh.
18. With a second test user, confirm RLS prevents access to the first user's sites, records, reports, subscription and evidence.

## Launch gate
Do not merge PR #4 until the end-to-end test above passes against the real Supabase, Netlify and Stripe environments. Do not mark the release production-ready based on code review alone.
