-- VanGuard Clean release hardening migration.
-- Run after vanguard-clean-schema.sql and vanguard-clean-report.sql.
-- Safe to run repeatedly.

-- Prevent duplicate answers for the same task in a record.
create unique index if not exists clean_record_items_record_task_unique
  on public.clean_record_items(record_id, checklist_item_id);

-- Report snapshots are one-per-record and have stable identifiers.
create unique index if not exists clean_report_number_unique
  on public.clean_report_snapshots(report_number);

-- Helpful lookup indexes for the production workflow.
create index if not exists clean_record_items_record_idx
  on public.clean_record_items(record_id);
create index if not exists clean_signoffs_record_idx
  on public.clean_signoffs(record_id);
create index if not exists clean_evidence_record_item_idx
  on public.clean_evidence(record_id, record_item_id);
