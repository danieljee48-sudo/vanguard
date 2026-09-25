# VanGuard Clean — UX / Product Design Review

## Design direction
VanGuard Clean should feel like a professional field-service product, not a generic admin dashboard. Cleaners are usually standing, moving, using one hand, and working from a phone. Office/admin users need richer history, evidence and reporting on desktop.

## Implemented in this pass

- One-tap setup from **Start a clean** when a site/checklist is missing.
- Checklist templates for Office, Pub/Bar and Communal Area.
- Editable task builder with add/remove task controls.
- Mobile-first spacing, 16px form controls, larger touch targets and sticky navigation/actions.
- Cleaning progress bar with live completion count.
- Large Pass / Fail / N/A touch controls instead of dropdowns.
- Automatic focus/scroll to the next incomplete task.
- Photos upload immediately and persist with the cleaning record.
- Historical Records search.
- Historical record detail view with checklist results, issues, sign-off and photo gallery.
- Polished printable report with photo evidence.
- One-tap report email flow for client/manager recipients.
- Email report includes photo evidence as inline images/attachments.
- Completion screen exposes View/Print and Email actions.

## Product-quality rules

1. The cleaner should never have to guess the next action.
2. Every destructive or irreversible action should have clear feedback.
3. Never make a cleaner type something that the system already knows.
4. Prefer one-tap choices over dropdowns on the mobile cleaning workflow.
5. Keep the primary action visible without scrolling when practical.
6. Save evidence as soon as it is captured, not only at final submission.
7. A completed record must remain easy to find and inspect later.
8. Reports should be client-presentable without manual cleanup.
9. Empty states should explain what to do next and provide the action.
10. Errors should explain the problem and the recovery action.
11. Desktop should optimise for management/history; mobile should optimise for execution.
12. Keep sensitive keys server-side and keep user data isolated by authenticated user.

## Next design backlog

- Cleaner profile / team member selection so names do not need to be typed each time.
- Site-specific checklist defaults so the site and checklist can be preselected.
- Recurring cleaning schedule / "today's cleans" home screen.
- Offline queue with sync status for poor-signal buildings.
- Multiple photos per task with thumbnail previews before upload.
- Photo captions / before-after evidence types.
- Swipe or next/previous task navigation on phones.
- Report delivery history and resend.
- Client contact book per site.
- Client-specific report branding.
- PDF generation server-side for consistent attachments.
- Email delivery status (sent/delivered/bounced).
- Checklist versioning so old records retain the exact checklist used.
- Cleaner signatures / client signatures on touchscreens.
- Issue resolution workflow from the history view.
- Filters by site, cleaner, status and date range.
- Dashboard "Today's work" queue.
- Onboarding wizard for the first site/checklist.
- Usage limits and plan entitlements surfaced clearly.
- Accessibility pass including keyboard navigation, focus states and screen-reader labels.
- Performance pass for accounts with hundreds/thousands of records.
- Automated end-to-end mobile regression tests.

## QA gate before production

- Fresh account → site → checklist → clean → photo → complete → sign-off → report.
- Save and resume a partially completed clean.
- Refresh/reopen historical record and verify evidence.
- Email a report with 0, 1 and multiple photos.
- Test report on Gmail, Outlook and mobile mail.
- Test a flagged clean and corrective action.
- Test second-user isolation for sites, records, evidence and reports.
- Test phone portrait and landscape.
- Test slow/unstable connection around photo upload.
- Verify no service-role key, Stripe secret or Resend key reaches browser JavaScript.
