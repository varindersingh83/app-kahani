# Vendor Allowlist

Launch geography: United States first.

Approved production vendors:

- Render: API, background worker, managed Postgres.
- Clerk: parent authentication.
- OpenRouter: external text/image generation with family photos stripped from provider payloads.

Conditional vendors:

- Private object storage and KMS/managed-key provider remain pending security review.
- Analytics provider remains pending review and must accept metadata-only events.
- Alerting provider remains pending review and must receive metadata-only critical events.

Prohibited production use:

- Selling family data.
- Sending family photos to text LLM providers.
- Sending raw prompts, names, descriptors, photos, or generated images to analytics.
- Production staging with copied production family data.
