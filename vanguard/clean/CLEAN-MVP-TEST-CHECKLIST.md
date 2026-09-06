# VanGuard Clean — release test checklist

## Critical path
- [ ] New user can create an account and sign in.
- [ ] User can create a customer/site.
- [ ] User can create a checklist with multiple tasks.
- [ ] Start a clean creates exactly one in-progress record.
- [ ] Every required task supports Pass / Fail / N/A.
- [ ] Required Pending tasks block completion.
- [ ] Save & resume persists notes and task results.
- [ ] Resume does not duplicate record items.
- [ ] Photo evidence uploads only to the private Clean bucket.
- [ ] A failed task creates a corrective action.
- [ ] Completing a clean is idempotent for checklist items/issues.
- [ ] Client sign-off can be recorded once.
- [ ] Report includes site, checklist, results, issues, evidence counts and sign-off.
- [ ] Report snapshot is persisted.
- [ ] Print flow opens a separate report window.

## Security
- [ ] Supabase RLS is enabled on all Clean customer tables.
- [ ] Service-role key exists only in Netlify environment variables.
- [ ] Clean evidence bucket remains private.
- [ ] Storage paths begin with the authenticated user's ID.
- [ ] No service-role secret is present in frontend files.
- [ ] Checkout uses server-side Stripe secret only.

## Revenue
- [ ] 14-day trial requires a payment method.
- [ ] Correct Clean Stripe monthly/yearly price IDs are configured.
- [ ] Business is presented as the recommended plan.
- [ ] Trial converts automatically after 14 days unless cancelled.
- [ ] Checkout success returns to `/clean`.

## Mobile
- [ ] Runner works on a phone without horizontal scrolling.
- [ ] Camera/photo input works on supported mobile browsers.
- [ ] Buttons have comfortable touch targets.
- [ ] Long checklist names do not break layout.

## Release gate
Do not merge to `main` until the critical path and security checks above pass against the real Supabase/Netlify environment.
