# VanGuard Clean

International commercial cleaning quality & compliance documentation SaaS.

## Positioning

**Prove your cleaning was done.**

VanGuard Clean is intentionally separate from the existing Food app during MVP development so Food remains stable.

## International product principle

The core workflow is country-neutral. Country-specific settings and templates sit on top of it rather than changing the data model.

The product should document work and evidence; it must not make blanket claims that a customer is legally compliant with a particular regulator.

Initial regional support:

- INTL — general commercial cleaning
- GB — United Kingdom / HSE-oriented terminology
- US — United States / OSHA-oriented terminology
- CA — Canada
- AU — Australia

The same account can eventually select its operating country, language, timezone, date format, currency and measurement system.

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
- Regional settings

## International architecture

`vanguard-clean-schema.sql` contains the core Clean tables.

`vanguard-clean-international-schema.sql` adds:

- `clean_settings` for country, locale, currency, timezone, date format, measurement system and language
- `clean_evidence` for evidence metadata
- private Supabase Storage bucket `clean-evidence`
- `clean_template_catalog` for reusable regional/product templates

Evidence storage is private and scoped to the authenticated user. Files should be delivered through authenticated access or signed URLs, not a public bucket.

Regional templates are product defaults, not legal advice or a certification of compliance.
