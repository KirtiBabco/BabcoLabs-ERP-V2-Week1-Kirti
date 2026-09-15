# Week 1 Master Build Plan

Source of truth: `babcofoods/babco-labs-erp-v2-training-curriculum` (READ ONLY).

Execution rule: **Simple → Small → Buildable → Testable → Verifiable**.

Work in progress limit: **one build unit at a time**.

## Execution Order

| # | Build Unit | Expected Proof | Status |
|---|---|---|---|
| 0.1 | Repository bootstrap | README, plan, tracker, context and four project folders exist | In Progress |
| 0.2 | Node.js/TypeScript/Express/Vitest baseline | Build and smoke test pass | Not Started |
| 0.3 | Environment baseline | `.env.example`, SQL config pattern, no committed secrets | Not Started |
| 1.1 | P1 SQL model | Parent/child relational rows with PK/FK/unique constraints | Not Started |
| 1.2 | P1 API contract + validation | Valid request accepted; invalid payload rejected | Not Started |
| 1.3 | P1 POST/GET durability | Create, restart, retrieve | Not Started |
| 1.4 | P1 filter/update/lines/errors | Required 400/404/409 and filtering/update tests pass | Not Started |
| 2.1 | P2 workflow data model | Supplied workflow definitions load from data | Not Started |
| 2.2 | P2 generic transition engine | Valid transition passes; invalid transition rejected | Not Started |
| 2.3 | P2 atomic state/history | State and history change together or neither changes | Not Started |
| 2.4 | P2 concurrency | Competing incompatible transitions: at most one wins | Not Started |
| 3.1 | P3 storage boundary | Blob has bytes; SQL has metadata only | Not Started |
| 3.2 | P3 upload + SHA-256 | Uploaded sample stored with generated key and hash | Not Started |
| 3.3 | P3 exact retrieval | Downloaded bytes/hash match original | Not Started |
| 3.4 | P3 partial failure handling | Cleanup/reconciliation behavior demonstrated | Not Started |
| 4.1 | P4 canonical fingerprint | Equivalent JSON ordering gives same fingerprint | Not Started |
| 4.2 | P4 first transaction | One idempotency record + one adjustment commit | Not Started |
| 4.3 | P4 replay/conflict | Same key/body replays; changed body conflicts | Not Started |
| 4.4 | P4 concurrency | Ten simultaneous duplicates create exactly one business effect | Not Started |
| 4.5 | P4 lost-response recovery | Retry after commit returns original result | Not Started |
| 5.1 | Full acceptance regression | Required tests for all four projects pass | Not Started |
| 5.2 | Friday learning evidence | Design decisions, rejected alternative, failure evidence, ERP inheritance recorded | Not Started |

## Scope Firewall

Do not add polished UI, Entra/OAuth, LLM decision-making, Service Bus, distributed orchestration, production data, or speculative shared frameworks in Week 1.

If a unit fails, isolate the exact failing unit, collect evidence, use RCA to identify the root cause, then use RCS to select the smallest safe correction. Re-test before continuing.
