# VanGuard Clean — MVP completion path

## Product promise
**Prove your cleaning was done.**

## Core cleaner journey
1. Sign up / start trial.
2. Add customer and site.
3. Choose a checklist.
4. Start a clean.
5. Work through every task with **Pass / Fail / N/A**.
6. Add a note or photo to a task when evidence is useful.
7. Flag corrective actions for failed work.
8. Complete the clean.
9. Capture optional client sign-off.
10. Generate a professional report.

## Definition of done for MVP
- [ ] Auth and account creation
- [ ] 14-day card-required trial connected to Stripe
- [ ] First-run onboarding that gets a user to their first completed clean quickly
- [ ] Sites CRUD
- [ ] Checklist CRUD
- [ ] Checklist item CRUD
- [ ] Cleaner runner with Pass / Fail / N/A
- [ ] Save/resume in-progress records
- [ ] Private photo evidence upload
- [ ] Issues and corrective actions
- [ ] Client sign-off
- [ ] Report snapshot saved to Supabase
- [ ] Printable/PDF-ready report
- [ ] Dashboard showing recent cleans and open issues
- [ ] Country/locale defaults
- [ ] Demo data / demo mode
- [ ] Responsive mobile-first UI

## Revenue gates
A new account is not considered activated until it has completed at least one clean and generated one report.

Primary funnel:
**Visitor → Signup → Trial with card → First clean → First report → Paid → Retained**

## Deliberate exclusions
No payroll, accounting, invoicing, HR, route optimisation, or full CRM in the MVP.

## Implementation notes
The existing `index.html` is a compact vanilla frontend. New behaviour is being isolated into small modules so the core workflow can be integrated without destabilising the existing Food product.

Supporting modules currently include:
- `clean-workflow.js` — evidence upload/signing helpers
- `clean-runner.js` — cleaner workflow state/validation
- `clean-report.js` — report snapshot and print rendering
- `clean-demo-data.js` — realistic demo dataset
- `international-config.js` — country/locale defaults
