# Week 1 Progress Tracker

Status values:

- `[ ]` Not Started
- `[~]` In Progress
- `[X]` Verified Complete
- `[!]` Blocked

| Build Unit | Project | Capability | Status | Dependency / Blocker | Verification / Evidence |
|---|---|---|---|---|---|
| 0.1 Repository Bootstrap | Common | Repository handoff | [X] | None | `evidence/BU-0.1-repository-bootstrap.md` |
| 0.2 Runtime Baseline | Common | Tools/APIs, Quality | [X] | 0.1 | CI run `34966136508` succeeded |
| 0.3 Environment Baseline | Common | Security | [X] | 0.2 | CI run `34966225158` succeeded; env guard tests pass |
| 1.1 SQL Model | Business Record API | Data Contracts | [~] | Needs isolated Week 1 Azure SQL lab connection to execute/verify DDL | SQL model committed at `project-01-business-record-api/sql/schema.sql`; DB verification pending |
| 1.2 Contract + Validation | Business Record API | Data Contracts, Quality | [ ] | 1.1 verification | Positive + negative API tests |
| 1.3 Durable POST/GET | Business Record API | Data Contracts, Reliability | [ ] | 1.2 | Restart-safe create/read |
| 1.4 Filter/Update/Errors | Business Record API | Data Contracts | [ ] | 1.3 | 400/404/409 and update/filter tests |
| 2.1 Workflow Data | State Machine | State | [ ] | Project 1 baseline | Definitions/states/transitions loaded |
| 2.2 Transition Engine | State Machine | State, Policy/Business Rules | [ ] | 2.1 | Valid/invalid transition tests |
| 2.3 Atomic State + History | State Machine | State, Governance/Audit | [ ] | 2.2 | Transaction rollback/commit proof |
| 2.4 Concurrency | State Machine | Reliability | [ ] | 2.3 | Competing transitions test |
| 3.1 SQL/Blob Boundary | Evidence Store | Data Contracts | [ ] | Common baseline | Metadata in SQL; bytes in Blob |
| 3.2 Upload + Hash | Evidence Store | Governance/Audit | [ ] | 3.1 | SHA-256 and generated blob key |
| 3.3 Exact Retrieval | Evidence Store | Quality | [ ] | 3.2 | Byte/hash equality proof |
| 3.4 Partial Failure | Evidence Store | Reliability | [ ] | 3.3 | Cleanup/reconciliation proof |
| 4.1 Fingerprint | Idempotent Processor | Data Contracts | [ ] | Common baseline | Canonical payload tests |
| 4.2 First Transaction | Idempotent Processor | Reliability | [ ] | 4.1 | One committed business effect |
| 4.3 Replay + Conflict | Idempotent Processor | Reliability | [ ] | 4.2 | Replay same result; conflict changed payload |
| 4.4 Concurrency | Idempotent Processor | Reliability | [ ] | 4.3 | Ten calls -> one effect |
| 4.5 Lost Response | Idempotent Processor | Reliability | [ ] | 4.4 | Retry returns original result |
| 5.1 Full Regression | All | Quality | [ ] | 1-4 | Full acceptance suite passes |
| 5.2 Friday Evidence | All | ERP Architecture judgment | [ ] | 5.1 | Learnings + failure evidence + decisions |
