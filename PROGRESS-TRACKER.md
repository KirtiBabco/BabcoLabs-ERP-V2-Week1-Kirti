# Week 1 Progress Tracker

Status values:

- `[ ]` Not Started
- `[~]` In Progress
- `[X]` Verified Complete
- `[!]` Blocked

| Build Unit | Project | Capability | Status | Dependency | Verification / Evidence |
|---|---|---|---|---|---|
| 0.1 Repository Bootstrap | Common | Repository handoff | [~] | None | Repo structure + reference docs |
| 0.2 Runtime Baseline | Common | Tools/APIs, Quality | [ ] | 0.1 | TypeScript build + smoke test |
| 0.3 Environment Baseline | Common | Security | [ ] | 0.2 | `.env.example`; no secrets committed |
| 1.1 SQL Model | Business Record API | Data Contracts | [ ] | 0.3 | PK/FK/unique constraints proven |
| 1.2 Contract + Validation | Business Record API | Data Contracts, Quality | [ ] | 1.1 | Positive + negative API tests |
| 1.3 Durable POST/GET | Business Record API | Data Contracts, Reliability | [ ] | 1.2 | Restart-safe create/read |
| 1.4 Filter/Update/Errors | Business Record API | Data Contracts | [ ] | 1.3 | 400/404/409 and update/filter tests |
| 2.1 Workflow Data | State Machine | State | [ ] | 1.x | Definitions/states/transitions loaded |
| 2.2 Transition Engine | State Machine | State, Policy/Business Rules | [ ] | 2.1 | Valid/invalid transition tests |
| 2.3 Atomic State + History | State Machine | State, Governance/Audit | [ ] | 2.2 | Transaction rollback/commit proof |
| 2.4 Concurrency | State Machine | Reliability | [ ] | 2.3 | Competing transitions test |
| 3.1 SQL/Blob Boundary | Evidence Store | Data Contracts | [ ] | 0.3 | Metadata in SQL; bytes in Blob |
| 3.2 Upload + Hash | Evidence Store | Governance/Audit | [ ] | 3.1 | SHA-256 and generated blob key |
| 3.3 Exact Retrieval | Evidence Store | Quality | [ ] | 3.2 | Byte/hash equality proof |
| 3.4 Partial Failure | Evidence Store | Reliability | [ ] | 3.3 | Cleanup/reconciliation proof |
| 4.1 Fingerprint | Idempotent Processor | Data Contracts | [ ] | 0.3 | Canonical payload tests |
| 4.2 First Transaction | Idempotent Processor | Reliability | [ ] | 4.1 | One committed business effect |
| 4.3 Replay + Conflict | Idempotent Processor | Reliability | [ ] | 4.2 | Replay same result; conflict changed payload |
| 4.4 Concurrency | Idempotent Processor | Reliability | [ ] | 4.3 | Ten calls -> one effect |
| 4.5 Lost Response | Idempotent Processor | Reliability | [ ] | 4.4 | Retry returns original result |
| 5.1 Full Regression | All | Quality | [ ] | 1-4 | Full acceptance suite passes |
| 5.2 Friday Evidence | All | ERP Architecture judgment | [ ] | 5.1 | Learnings + failure evidence + decisions |
