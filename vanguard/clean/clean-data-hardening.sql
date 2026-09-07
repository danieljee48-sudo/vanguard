-- VanGuard Clean data integrity hardening
-- Run after vanguard-clean-schema.sql and clean-evidence-schema.sql.

-- Prevent duplicate checklist answers for the same record/item.
create unique index if not exists clean_record_items_record_item_uidx
  on clean_record_items(record_id, checklist_item_id)
  where checklist_item_id is not null;

-- Speed up the main operational screens and report queries.
create index if not exists clean_record_items_record_idx
  on clean_record_items(record_id, created_at desc);
create index if not exists clean_signoffs_record_idx
  on clean_signoffs(record_id, signed_at desc);
create index if not exists clean_evidence_record_idx
  on clean_evidence(record_id, created_at desc);
create index if not exists clean_issues_record_status_idx
  on clean_issues(record_id, status, created_at desc);
