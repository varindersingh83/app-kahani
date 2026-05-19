# Unsafe Output Shown Runbook

Trigger: parent reports unsafe story text or image, or output safety alert fires.

Immediate action: hide the affected book, disable generation if repeated, and preserve redacted debug artifact metadata.

Diagnosis: review output safety category, provider model version, generation job ID, and non-content metadata.

Mitigation/rollback: block the unsafe output pattern, rotate model if provider-specific, and redeploy.

Follow-up: add safety fixture coverage and update prompt/output policy.
