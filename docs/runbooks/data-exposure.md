# Data Exposure Runbook

Trigger: suspected leak of photos, prompts, child names, generated images, descriptors, or private asset links.

Immediate action: disable sharing, revoke affected links, scale worker to zero, preserve logs, and rotate impacted secrets.

Diagnosis: identify affected users, asset IDs, share tokens, provider calls, and log entries using metadata-only audit trails.

Mitigation/rollback: delete exposed assets, invalidate sessions if needed, deploy redaction fixes, and notify affected users according to legal guidance.

Follow-up: add a regression test for the exposure path and update vendor/security review.
