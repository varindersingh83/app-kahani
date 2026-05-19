# Database Restore Runbook

Trigger: data corruption, accidental deletion, failed migration, or restore drill.

Immediate action: stop writers by scaling API/worker down or disabling generation.

Diagnosis: identify target restore time, impacted tables, migration status, and latest known-good backup/export.

Mitigation/rollback: restore Render Postgres to a separate database first, verify integrity, then promote or copy data under an explicit operator checklist.

Follow-up: record restore duration, data loss window, and schema drift findings.
