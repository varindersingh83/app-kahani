# Production Launch Runbook

Trigger: public signup or production deploy.

Immediate action: verify Render API, worker, managed Postgres, Clerk, OpenRouter, alerting, analytics, encryption, private storage, and provider photo policy env checks pass.

Diagnosis: run `/api/healthz`, confirm worker logs show polling, check database connectivity, and verify no production `/api/story-runs` static access.

Mitigation/rollback: disable public signup, scale worker to zero, rotate provider keys, or roll back to the previous Render deploy.

Follow-up: record launch checklist results, incident notes, and any config drift.
