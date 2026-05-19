# Provider Outage Runbook

Trigger: OpenRouter/provider failures spike or generation returns repeated provider errors.

Immediate action: pause worker or lower generation quota to stop spend and failed user experiences.

Diagnosis: check provider status, model-specific failures, API auth, and recent deploys.

Mitigation/rollback: switch approved model, restore previous config, or keep generation disabled while preserving existing books.

Follow-up: document outage timeline and update provider fallback policy.
