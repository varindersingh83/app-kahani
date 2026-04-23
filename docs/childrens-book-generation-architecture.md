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
| 2    | Story Spine Agent           | AI                            |
| 3    | Story Writer Agent          | AI                            |
| 4    | Storyboard Agent            | AI                            |
| 5    | Character Consistency Agent | deterministic + AI assist     |

Phase A also assigns each page a fixed sheet slot in a 3-column by 4-row layout so the later image sheet can be sliced deterministically into 12 page images.

### Phase B. Page Production (Parallel)

For each page:

```text
Step 6 -> Step 7 -> Step 8 -> Step 9
```

| Step | Agent                | Type          |
| ---- | -------------------- | ------------- |
| 6    | Prompt Builder Agent | hybrid        |
| 7    | Illustration Agent   | AI            |
| 8    | Alignment Agent      | AI            |
| 9    | Iteration Controller | deterministic |

Parallelization rule:

- All pages run independently
- Failures affect only that page

The illustration stage now produces one composite watercolor sheet for the whole 12-page book, using the page-level prompts and sheet slots from Phase A. A deterministic slicer then cuts that single sheet into 12 page images, one per page slot, before Phase C packages the final book.

### Phase C. Final Assembly (Sequential)

```text
Step 10 -> Step 11 -> Step 12 -> Human QA
```

| Step | Agent           | Type                        |
| ---- | --------------- | --------------------------- |
| 10   | Layout Agent    | deterministic + optional AI |
| 11   | Editor Agent    | AI                          |
| 12   | Packaging Agent | deterministic               |
| 13   | Human QA        | human                       |

Phase C consumes the sliced page images, preserves their page order, and packages the text, page image URLs, and optional sheet image URL into the final book record.

## 5. Orchestration Layer

Master Orchestrator responsibilities:

1. Workflow control
   - Enforce step order
   - Manage transitions
   - Prevent invalid execution paths
2. Parallel execution
   - Spawn page workers after Step 5
   - Track each page independently
3. State management
   - Book-level state
   - Page-level state
   - Retry counters
   - Flags
4. Retry enforcement

```text
max_retries = 3
if retries >= 3:
    advance_with_flag = true
```

5. Event logging
   - Every action is logged as structured data.
6. Human escalation
   - Triggered when retry limit reached
   - low alignment score persists
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
