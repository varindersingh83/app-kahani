# Behavior Story Library Generation

This runbook covers the offline generator for the behavior story concept library. It creates reviewable story concepts, not finished 12-page books and not images.

## What It Produces

The generator writes:

```text
artifacts/behavior-story-library/
  behavior-story-library.json
  markdown/
    001-full-body-tantrum-when-told-no.md
    002-screaming-in-public.md
  runs/
    <timestamp>/
      run-summary.json
      issue-attempts/
        001-full-body-tantrum-when-told-no.json
```

`behavior-story-library.json` is the app-readable source. It includes behavior issue metadata, verified reference books, approved story concepts, QA metadata, generation status, and the Markdown filename.

Markdown files are for human review. They intentionally contain only the behavior issue title and approved story concepts. They do not include reference books, failed attempts, model usage, or QA logs.

## Inputs

The behavior issues come from:

```text
artifacts/api-server/src/services/story-sheet/behaviorIssueTemplate.ts
```

Reference books are verified through book metadata providers. Open Library works without an API key. Google Books is available as a fallback provider in the code path.

Story concepts are generated and judged through the configured text AI model.

## Environment

Provider-backed generation needs the same text AI environment used by story generation:

```text
AI_INTEGRATIONS_OPENROUTER_BASE_URL
AI_INTEGRATIONS_OPENROUTER_API_KEY
AI_INTEGRATIONS_OPENROUTER_MODEL
OPENROUTER_SITE_URL
OPENROUTER_APP_TITLE
```

The OpenAI-compatible fallback names are also supported:

```text
AI_INTEGRATIONS_OPENAI_BASE_URL
AI_INTEGRATIONS_OPENAI_API_KEY
AI_INTEGRATIONS_OPENAI_MODEL
```

Optional generator controls:

```text
BEHAVIOR_STORY_LIBRARY_OUTPUT_DIR
BEHAVIOR_STORY_LIBRARY_SOURCE_ROWS
BEHAVIOR_STORY_LIBRARY_LIMIT
BEHAVIOR_STORY_LIBRARY_BATCH_SIZE
BEHAVIOR_STORY_LIBRARY_MAX_BATCHES
```

`BEHAVIOR_STORY_LIBRARY_SOURCE_ROWS` is a comma-separated list such as `1,2,3`.

## Run A Small Review Batch First

Before running all 100 issues, run a small subset so story quality and cost can be inspected:

```bash
BEHAVIOR_STORY_LIBRARY_SOURCE_ROWS=1,2 pnpm --filter @workspace/scripts run behavior:story-library
```

Or use a simple count:

```bash
BEHAVIOR_STORY_LIBRARY_LIMIT=3 pnpm --filter @workspace/scripts run behavior:story-library
```

The full run is:

```bash
pnpm --filter @workspace/scripts run behavior:story-library
```

## Review Workflow

1. Open the Markdown file for one behavior issue.
2. Review the approved story concepts only.
3. Check whether the parent action makes practical expert sense.
4. Check that the child makes believable progress through a visible action.
5. Check that the ending feels earned and child-facing.
6. Use the JSON only when you need to see verified reference books, QA scores, generation status, or warnings.

## Generation Status

`complete` means the issue has three approved concepts.

`manual_review_needed` means at least one concept passed, but fewer than three passed before the retry cap. The approved concepts are saved, and the missing count is recorded.

`failed` means no usable concept record was generated for that issue. The run summary and issue attempt log should explain the failure.

## Important Boundaries

- This generator does not change the live Create Story flow.
- It does not generate images.
- It does not create 12-page manuscripts.
- It does not write production database rows.
- Failed story concepts are excluded from the final user-facing JSON.
- Reference books are real metadata references, not text sources to copy from.
