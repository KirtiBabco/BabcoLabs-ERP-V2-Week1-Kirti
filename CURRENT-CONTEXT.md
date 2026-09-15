# Current Context

## Current Week
Week 1 — Data + API + State

## Source of Truth
`babcofoods/babco-labs-erp-v2-training-curriculum` — READ ONLY.

## Current Project
Project 1 — Business Record API.

## Current Build Unit
1.1 SQL Model.

## Last Verified Completion
Build Units 0.1, 0.2 and 0.3 are verified complete.

- Repository bootstrap complete.
- Node.js 22 + TypeScript + Express + Vitest baseline passed CI.
- Environment guard tests passed CI.

## Current Blocker
The Project 1 SQL DDL is committed, but it cannot be marked verified until it is executed against an isolated Week 1 Azure SQL lab database/schema. The curriculum does not provide credentials or a connection string; production data/database must not be used.

## Next Action
Provide or provision an isolated Week 1 Azure SQL lab target, set `AZURE_SQL_CONNECTION_STRING` securely outside source control, execute `project-01-business-record-api/sql/schema.sql`, then prove PK/FK/unique/check constraints with positive and negative SQL tests.

## Important Decisions
- Use one personal Week 1 repository with four isolated project folders.
- Do not modify the Training Curriculum repository.
- Do not use the old BABCO Labs ERP V2 Readiness Program repository.
- No ORM in Week 1.
- No polished UI, Entra/OAuth, AI business decisions, Service Bus, or production data in Week 1.
- One build unit at a time unless an external blocker makes another unit fully independent.
- A unit is complete only after positive test, negative/failure test where applicable, and evidence.
- Use RCA Agent v5 when a unit is genuinely failing; use RCS Solver v2 for the smallest safe corrective plan.
