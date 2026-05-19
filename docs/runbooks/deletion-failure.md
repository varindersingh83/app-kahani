# Deletion Failure Runbook

Trigger: account deletion request fails or remains retryable past the deletion SLA.

Immediate action: mark deletion state as failed/retryable and alert the operator.

Diagnosis: identify blocked records, assets, share links, consent records, and audit/deletion state by metadata IDs.

Mitigation/rollback: retry deletion, manually revoke assets/share links, and verify no user-linked records remain active.

Follow-up: document root cause and add deletion coverage for the failed resource type.
