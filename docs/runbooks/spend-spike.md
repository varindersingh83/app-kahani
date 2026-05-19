# Spend Spike Runbook

Trigger: provider spend exceeds budget, generation volume spikes, or spend-cap alert fires.

Immediate action: pause worker, lower quotas, and disable public generation if needed.

Diagnosis: inspect job count, retry loops, provider error rate, idempotency behavior, and abusive patterns.

Mitigation/rollback: cap retries, block abusive accounts, rotate keys if leaked, and redeploy cost controls.

Follow-up: update spend caps, alert thresholds, and abuse-control tests.
