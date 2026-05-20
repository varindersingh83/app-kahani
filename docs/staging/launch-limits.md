# Launch Limits And Emergency Controls

Date: 2026-05-19

These limits apply to the path from locked staging to a small public beta. They are intentionally conservative until durable workers, private storage, output safety, alerting, deletion, and production runbooks are complete.

## Initial Limits

| Control | Initial value | Owner | Notes |
|---|---:|---|---|
| Staging users | 10 | Founder/operator | Internal testers only |
| Public beta users | 25 | Founder/operator | Do not enable until launch blockers are cleared |
| Generations per user per day | 3 | Product/engineering | Lower if provider cost is higher than expected |
| Global generations per day | 50 | Product/engineering | Applies during capped beta |
| Monthly provider spend cap | 100 USD | Founder/operator | Enforce in provider dashboard where possible |
| Max retries per generation | 2 | Engineering | Final value belongs with durable worker implementation |
| Share-link lifetime | 24 hours | Product/engineering | Required before public sharing |

## Required Shutdown Controls

| Control | Purpose | Owner | Expected behavior |
|---|---|---|---|
| `SIGNUP_ENABLED` | Stop new public signups | Founder/operator | Existing testers may keep access if safe |
| `GENERATION_ENABLED` | Stop story/image generation | Founder/operator | Existing accounts can still view safe existing content |
| Provider key disable | Stop all provider spend immediately | Founder/operator | Rotate/disable staging or production key in provider dashboard |
| Clerk app disable / allowlist | Stop auth access during incident | Founder/operator | Restrict to known testers or disable app access |
| Render rollback | Revert bad deploy | Engineering | Roll back to last known safe deploy |

## Alert Triggers

| Trigger | Severity | Owner | Initial action |
|---|---|---|---|
| Provider spend spike | Critical | Founder/operator | Disable generation, inspect usage, lower cap |
| Prompt-injection provider-call violation | Critical | Engineering | Disable generation, preserve metadata, investigate guardrail bypass |
| Photo-policy violation | Critical | Engineering | Disable generation, inspect payload path, invalidate staging run |
| Unsafe output shown | Critical | Engineering/product | Disable generation, preserve evidence, open incident |
| Stuck generation jobs | High | Engineering | Pause generation if recurring, inspect worker/job state |
| Provider failure spike | High | Engineering | Pause generation if retries amplify cost |
| Auth outage | High | Founder/operator | Disable signup if needed, inspect Clerk status/config |
| Deletion failure | Critical before public launch | Engineering | Keep public signup blocked until deletion workflow is reliable |

## Public Signup Blockers

Public signup remains blocked until all of these are true:

- staging smoke test passes with synthetic data only
- private asset storage is implemented or public asset exposure is explicitly not present in the tested path
- app-level encryption/KMS boundary is implemented for sensitive production data
- durable generation jobs have idempotency, retry limits, stuck-job handling, and cost controls
- output safety gates and redacted debug artifacts are implemented
- account deletion workflow is implemented and tested
- Terms and Privacy Policy are ready
- vendor allowlist is reviewed
- internal security review is complete
- alert routing and shutdown controls are tested

## Review Cadence

- Review limits before every staging promotion.
- Review limits after any provider-cost surprise or failed generation spike.
- Review limits before any new tester group is added.
