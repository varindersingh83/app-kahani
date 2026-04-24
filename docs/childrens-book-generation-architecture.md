# Children's Book Generation System

Architecture Specification (AI + Deterministic Hybrid)

## 1. System Overview

This system generates illustrated children's books (ages 2-5) using:

- a deterministic orchestration core
- a set of specialized AI agents
- a page-parallel execution model
- a human QA gate at the end

The system is designed as a controlled production pipeline, not an open-ended generation system.

## 2. Core Design Principles

1. Separation of concerns
   - Deterministic code handles control, state, rules
   - AI handles creativity and ambiguity
2. Strict pipeline
   - No agent skips steps
   - No agent modifies upstream outputs
3. Parallel page execution
   - Book structure is sequential
   - Page production is parallel
4. Bounded iteration
   - Max 3 retries per page per failure
   - No infinite loops
5. Human final authority
   - System produces candidates
   - Human approves or rejects

## 3. High-Level Architecture

```text
                ┌──────────────────────────┐
                │  Master Orchestrator     │
                │  (Deterministic Core)    │
                └──────────┬───────────────┘
                           │
        ┌──────────────────┼──────────────────┐
        │                  │                  │
 Book Setup         Page Workers        Final Assembly
 (Sequential)       (Parallel)          (Sequential)
```

## 4. Pipeline Phases

### Phase A. Book Setup (Sequential)

```text
Step 1 -> Step 2 -> Step 3 -> Step 4 -> Step 5
```

| Step | Agent                       | Type                          |
| ---- | --------------------------- | ----------------------------- |
| 1    | Input Agent                 | AI + deterministic validation |
| 2    | Story Brief Agent           | deterministic + AI assist     |
| 3    | Character Consistency Agent | deterministic + AI assist     |
| 4    | Sheet Slot Agent            | deterministic                 |
| 5    | Prompt Prep Agent           | deterministic                 |

Phase A now builds the reusable brief, character lock, and fixed 3-column by 4-row page-slot map that the image model uses for both the cover and storyboard sheet calls.

### Phase B. Image Generation and Slicing (Sequential)

```text
Step 6 -> Step 7 -> Step 8
```

| Step | Agent                  | Type                        |
| ---- | ---------------------- | --------------------------- |
| 6    | Cover Image Agent      | AI                          |
| 7    | Storyboard Sheet Agent | AI                          |
| 8    | Sheet Slicer Agent     | deterministic               |

The cover image call returns the cover art.
The storyboard-sheet call returns both the full 3x4 watercolor sheet and the canonical story text for all 12 pages.
A deterministic slicer then cuts that sheet into 12 page images, one per page slot.

### Phase C. Final Assembly (Sequential)

```text
Step 9 -> Step 10 -> Step 11 -> Human QA
```

| Step | Agent           | Type                        |
| ---- | --------------- | --------------------------- |
| 9    | Layout Agent    | deterministic + optional AI |
| 10   | Editor Agent    | AI                          |
| 11   | Packaging Agent | deterministic               |
| 12   | Human QA        | human                       |

Phase C consumes the sliced page images, preserves their page order, and packages the text, page image URLs, cover image URL, and storyboard sheet image URL into the final book record.

## 5. Orchestration Layer

Master Orchestrator responsibilities:

1. Workflow control
   - Enforce step order
   - Manage transitions
   - Prevent invalid execution paths
2. Parallel execution
   - Track artifact-level retries for the cover and storyboard sheet
3. State management
   - Book-level state
   - Sheet-level state
   - Retry counters
   - Flags
4. Retry enforcement

```text
max_retries = 3
if cover_retries >= 3:
    continue_without_cover = true
if sheet_retries >= 3:
    fail_or_escalate = true
```

5. Event logging
   - Every action is logged as structured data.
6. Human escalation
   - Triggered when storyboard validation fails
   - triggered when retries are exhausted on the sheet call
   - QA rejects output

## 6. Deterministic vs AI Responsibilities

### Deterministic Core

Handles:

- workflow graph
- job creation
- schema validation
- retry logic
- routing decisions
- state tracking
- logging
- storage
- layout rules
- packaging
- QA queue

### AI Agents

Handle:

- input interpretation
- story generation
- language writing
- visual planning
- image generation
- semantic alignment
- text refinement

## 7. Agent Definitions

### 1. Input Agent

Skills:

- requirement extraction
- structuring input
- ambiguity resolution

### 2. Story Spine Agent

Skills:

- narrative structure
- pacing
- emotional arcs

### 3. Story Writer Agent

Skills:

- early childhood language
- repetition patterns
- short sentence construction

### 4. Storyboard Agent

Skills:

- scene composition
- emotion visualization
- camera framing

### 5. Character Consistency Agent

Skills:

- identity locking
- visual trait persistence
- style enforcement

### 6. Prompt Builder Agent

Skills:

- prompt construction
- style conditioning
- negative prompt control

### 7. Illustration Agent

Skills:

- sheet image generation
- style adherence
- candidate variation
- consistent panel composition for later slicing

### 8. Alignment Agent

Skills:

- semantic comparison
- emotion matching
- visual-text coherence scoring

### 9. Iteration Controller (Deterministic)

Skills:

- rule enforcement
- retry routing
- failure classification

### 10. Layout Agent

Skills:

- page composition
- typography rules
- print formatting
- sheet-to-page image assembly

### 11. Editor Agent

Skills:

- readability refinement
- tone smoothing
- rhythm control

### 12. Packaging Agent

Skills:

- export formatting
- metadata bundling
- asset linking

### 13. Human QA

Skills:

- taste
- emotional validation
- final approval

## 8. Data Model

### books

```text
book_id
theme
status
current_step
page_count
created_at
updated_at
```

### pages

```text
page_id
book_id
page_number
current_step
status
alignment_score
retry_count
flag_for_human
```

### agent_runs

```text
run_id
agent_name
book_id
page_id
status
duration
error
```

### events

```text
event_id
book_id
page_id
agent
event_type
payload_json
timestamp
```

## 9. Event Logging Format

```json
{
  "timestamp": "...",
  "book_id": "BK-1042",
  "page": 3,
  "agent": "AlignmentAgent",
  "event": "score_generated",
  "score": 0.71,
  "status": "retry"
}
```

Logs are the primary interface for monitoring.

## 10. Parallelization Model

Sequential stages:

```text
1 -> 2 -> 3 -> 4 -> 5
```

Parallel stage:

```text
For each page:
6 -> 7 -> 8 -> 9
```

Sequential closing:

```text
10 -> 11 -> 12 -> QA
```

## 11. Iteration Rules

- Max 3 retries per page
- Retry only failing pages
- No full-book rollback
- After max retries:
  - select best candidate
  - mark page flagged
  - proceed

## 12. Minimal Dashboard Specification

Required views:

### 1. Book table

- status
- current step
- flags
- retries

### 2. Page table

- per-page progress
- alignment score
- retry count

### 3. Event log

Primary debugging interface.

### 4. QA queue

- flagged pages
- approval actions

### 5. Agent health

- error rate
- avg time
- throughput

## 13. Failure Modes

### 1. Character drift

Mitigation:

- lock character at Step 5
- reuse fixed prompt block

### 2. Infinite loops

Mitigation:

- hard retry cap

### 3. Misalignment

Mitigation:

- alignment scoring
- retry routing

### 4. Overuse of AI

Mitigation:

- move logic to deterministic core

### 5. Pipeline blockage

Mitigation:

- page-level independence

## 14. System Flow Summary

```text
Book Setup (Sequential)
    ↓
Page Production (Parallel)
    ↓
Final Assembly (Sequential)
    ↓
Human QA
```

## 15. Key Constraint Rules

- Every step outputs structured data
- No step mutates previous outputs
- Character identity immutable after Step 5
- Max 3 retries enforced
- Logs required for every action
- Human QA is final gate

## 16. Implementation Stack (Minimal)

- Orchestrator: queue + state machine
- Storage: relational DB
- AI: LLM + image model
- Logs: structured event stream
- UI: optional, logs-first

## 17. Final System Definition

This is not:

- a prompt chain
- a single AI workflow
- a monolithic generator

This is:

**a deterministic production system with AI workers operating inside strict constraints, producing consistent, reviewable outputs at scale.**
