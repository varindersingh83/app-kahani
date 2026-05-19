# Internal Security Review

Required before public signup:

- Prompt-injection guardrails are first in the request path.
- Required onboarding consent blocks app access when declined.
- Family photos are private, not public static files, and not sent to text LLM providers.
- Production character creation remains generic until local extraction model approval.
- Analytics and logs are metadata-only with tests rejecting content fields.
- Encryption key config fails closed in production.
- Account deletion route requires authenticated parent identity and fresh re-auth metadata.
- Private assets require authenticated owner access.
- Share links expire within 24 hours, are revocable, and expose redacted metadata.
- API and worker production env validation passes.
- Render API, worker, and Postgres are configured separately.
- Runbooks exist for launch, data exposure, unsafe output, stuck jobs, provider outage, deletion failure, database restore, auth outage, and spend spike.
