# Week 1 Execution Orchestrator

## Purpose
Keep Week 1 execution simple, dependency-aware, resumable, and evidence-driven.

The Training Curriculum repository remains READ-ONLY. All implementation and execution state lives in this repository.

## Controller Flow

```text
Week 1 Goal
   |
   v
Recursive Decomposer
   |
   v
Small Build Units
   |
   v
Dependency Graph Resolver
   |
   v
READY Queue
   |
   v
Execute One Unit
   |
   v
Test + Capture Evidence
   |
   +--> PASS --> Mark DONE --> Save Checkpoint --> Unlock Dependents --> Next READY Unit
   |
   +--> FAIL --> Capture Exact Evidence --> RCA v5 --> RCS v2 --> Smallest Safe Fix --> Retest
   |
   +--> HARD EXTERNAL BLOCK --> Mark BLOCKED --> Save Reason --> Continue Another READY Unit
```

## Recursive Decomposition Rule

Every App/Project is decomposed until each unit is small enough to answer all five questions:

1. What exactly will be built?
2. What does it depend on?
3. What is the positive test?
4. What is the negative/failure test?
5. What evidence proves completion?

If any answer is unclear, decompose again.

## Week 1 Hard Dependency Graph

```text
0.1 Repo Bootstrap
      |
0.2 Runtime Baseline
      |
0.3 Environment Baseline
      |
      +------ P1.1 SQL Model -> P1.2 Contract -> P1.3 Durable POST/GET -> P1.4 Full API
      |
      +------ P2.1 Workflow Data -> P2.2 Transition Engine -> P2.3 Atomic State -> P2.4 Concurrency
      |
      +------ P3.1 Storage Boundary -> P3.2 Upload+Hash -> P3.3 Retrieval -> P3.4 Failure Handling
      |
      +------ P4.1 Fingerprint -> P4.2 First Transaction -> P4.3 Replay/Conflict -> P4.4 Concurrency -> P4.5 Lost Response
```

Preferred learning order is P1 -> P2 -> P3 -> P4. However P2, P3, and P4 are not treated as hard-blocked merely because P1 has an external permission/secret/resource blocker. The resolver may select another READY branch.

## Pilot Before Full Execution

First prove the controller on the smallest useful Project 1 vertical slice:

```text
P1 Pilot
SQL schema
  -> POST one BusinessRequest
  -> persist in isolated Azure SQL
  -> GET same BusinessRequest
  -> restart service
  -> GET again
  -> capture evidence
```

Only after this flow is verified do we expand through the remaining P1 acceptance tests and then continue the preferred P2, P3, P4 order.

## Agent Must Not Stop Rule

Normal failure is not a stop condition.

On failure:

```text
FAIL
 -> collect exact logs / test output / SQL observation
 -> RCA v5
 -> RCS v2 smallest safe corrective plan
 -> apply correction
 -> retest
 -> PASS: continue
 -> same failure after remedy: deeper/scientist RCA
```

A unit may become BLOCKED only for a true external dependency the available tools cannot satisfy, such as missing human-only permission, unavailable secret, or unavailable external system. When one branch is BLOCKED, continue another dependency-ready branch.

The whole run should stop only when:

- all remaining units are externally BLOCKED, or
- the user explicitly cancels or changes the active execution scope.

## Checkpoint Rule

After every state change, persist:

- active unit
- unit status
- completed dependencies
- evidence reference
- blocker reason, if any
- RCA/RCS case reference, if used
- next READY units

`CURRENT-CONTEXT.md` and `PROGRESS-TRACKER.md` are the human-readable checkpoints. The machine-readable dependency graph is `build/week1-graph.json`.

## RCA of the Earlier Apparent Stop

RCA v5 result: **INSUFFICIENT_EVIDENCE** to prove an autonomous agent failure.

Known facts:

- Common Build Units 0.1-0.3 completed.
- Project 1 SQL work started and Week 1 Azure SQL resources were found.
- The conversation then switched to the PPT task before the Project 1 acceptance sequence finished.
- A separate earlier repository-creation pause was a proven external GitHub permission blocker.

Therefore the PPT interruption must not be mislabeled as an agent failure. The preventive improvement is to keep a durable dependency graph, READY queue, checkpoint, and explicit stop reason so future interruptions can resume deterministically.
