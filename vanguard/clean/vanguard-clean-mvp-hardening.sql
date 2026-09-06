-- VanGuard Clean MVP hardening migration. Run after the core and international schemas.
-- Makes sign-off one-per-record and adds useful report/history indexes.
create unique index if not exists clean_signoffs_record_unique on clean_signoffs(record_id);
create index if not exists clean_records_site_created_idx on clean_records(site_id,created_at desc);
create index if not exists clean_records_status_idx on clean_records(user_id,status);
create index if not exists clean_issues_status_idx on clean_issues(user_id,status);
create index if not exists clean_report_snapshots_record_created_idx on clean_report_snapshots(record_id,created_at desc);

-- Prevent duplicate checklist item snapshots when a cleaner resumes/completes a record.
create unique index if not exists clean_record_items_record_item_unique on clean_record_items(record_id,checklist_item_id);
