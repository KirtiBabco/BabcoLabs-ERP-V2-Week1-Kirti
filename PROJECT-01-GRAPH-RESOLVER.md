# Week 1 Project 1 - Recursive Graph Resolver

## Purpose

Run Project 1 as small independent modules that are still connected by explicit dependency gates.

Hierarchy:

`Project -> Module -> Submodule -> Build Unit/Task/Test`

The resolver executes only dependency-ready leaf nodes. Parent Project/Module/Submodule nodes are grouping and status-aggregation nodes, not executable work.

## Simple module map

```text
M0 Foundation
   |
   +----------------------+----------------------+
   |                      |                      |
   v                      v                      v
M1 Database          M2 Contract            M3 SQL Access
   |                      |                      |
   +----------+-----------+----------------------+
              |
              v
         M3 Core API
              |
      +-------+-------+-------+
      |               |       |
      v               v       v
 M4 Filter       M4 Update  M4 Lines/Errors
      \               |       /
       +--------------+------+
                      |
                      v
               M5 Verification
                      |
                      v
               Project 1 Done
```

## Module responsibilities

| Module | Independent work | Output | Connected to |
|---|---|---|---|
| M0 Foundation | Repo/runtime/environment | Executable baseline | Enables M1, M2, M3 data-access work |
| M1 Database | Header, lines, FK, constraints, seed | Reliable relational model | Required by Core API and SQL evidence |
| M2 Contract + Validation | OpenAPI, schemas, Ajv, error contract | Stable API contract | Required by Core API and error handling |
| M3 Core API | SQL access, POST, GET, transaction, restart proof | Working vertical slice | Joins M1 + M2; enables M4 |
| M4 Business Operations | Filter, patch, line operations, 400/404/409 | Complete business behavior | Parallel branches after Core API |
| M5 Verification | Full acceptance, SQL evidence, handoff | Verified Project 1 | Joins all final gates |

## Independent but interconnected rule

A module does not wait for unrelated work.

Example after M0 is complete:

- M1 can build Header and Line tables in parallel.
- M2 can build OpenAPI, schemas, and the error envelope in parallel.
- M3 can build the reusable SQL helper while M1/M2 continue.

But integration leaves wait for their explicit gates:

`M3.2.1 POST` requires:

- `M1.4.2` Database + seed verified;
- `M2.4.1` Contract + validation gate verified;
- `M3.1.2` Azure SQL connectivity verified.

This gives independence without allowing out-of-order integration.

## Failure / no-stop rule

```text
Leaf task fails
    |
    v
Capture evidence
    |
    v
RCA Agent v5
    |
    v
RCS Agent v2 -> smallest safe correction
    |
    v
Retest failed leaf

AT THE SAME TIME:
Resolver continues any unrelated dependency-ready leaf.
```

Resolver modes:

- `EXECUTE_READY` - normal ready work exists.
- `RECOVER_AND_CONTINUE` - failed branch needs RCA/RCS and independent work is also ready.
- `RUN_RCA_RCS` - failure exists and no unrelated work is ready.
- `WAIT_EXTERNAL` - every unfinished branch is directly or indirectly externally blocked.
- `COMPLETE` - every executable leaf is done.
- `DEADLOCK` - no valid explanation exists; treat as orchestration defect and run RCA.

## Checkpoint / resume

After every leaf transition, save statuses. On restart, restore the checkpoint and calculate READY leaves again. Completed work must not return to PENDING.

## Files

- `build/project1-recursive-graph.json` - complete Project 1 hierarchy and dependencies.
- `src/orchestrator/recursiveGraphResolver.ts` - validation, recursive leaf resolution, module aggregation, no-stop planning, checkpoint/restore.
- `tests/project1RecursiveGraphResolver.test.ts` - conformance tests for independence, interconnection, block handling, RCA/RCS recovery, cycles, and restart persistence.

## Completion rule

No parent module is complete because code merely exists. A module becomes DONE only when all executable descendant leaves, including required tests, are DONE.
