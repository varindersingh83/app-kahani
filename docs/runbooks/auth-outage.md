# Auth Outage Runbook

Trigger: Clerk outage, token validation failures, or widespread sign-in failures.

Immediate action: keep production auth fail-closed and post status to users if available.

Diagnosis: check Clerk status, API middleware logs, mobile auth errors, and recent env changes.

Mitigation/rollback: restore previous Clerk config, rotate keys if compromised, or pause generation until auth recovers.

Follow-up: document user impact and add synthetic auth checks.
