# Stuck Generation Jobs Runbook

Trigger: jobs remain running beyond heartbeat threshold or worker stuck alert fires.

Immediate action: inspect worker logs, queue depth, heartbeat age, and provider status.

Diagnosis: classify as provider latency, database lock, worker crash loop, or retry budget issue.

Mitigation/rollback: restart worker, lower concurrency, requeue stale jobs, or pause generation.

Follow-up: add a stuck-job regression test and tune heartbeat thresholds.
