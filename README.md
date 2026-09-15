# BABCO Labs ERP V2 — Week 1 — Kirti

This repository contains Kirti's independent Week 1 implementation for the BABCO Labs ERP Version 2 Training Program.

## Source of Truth

The curriculum, requirements, standards, starter kits, test expectations, and reference material must be read from:

**babcofoods/babco-labs-erp-v2-training-curriculum**

https://github.com/babcofoods/babco-labs-erp-v2-training-curriculum

### IMPORTANT — READ ONLY

The Training Curriculum repository is a **READ-ONLY source of truth** for this project.

Do not add, edit, delete, commit, merge, or change settings in the Training Curriculum repository from this implementation project.

Do not use the old **BABCO Labs ERP V2 Readiness Program** repository for training work.

## Week 1 Goal

Learn and demonstrate the Data + API + State baseline through small, buildable, testable, and verifiable units.

Week 1 required projects:

1. Business Record API
2. State Machine Service
3. Document Evidence Store
4. Idempotent Request Processor

## Week 1 Technical Baseline

- Node.js 22 LTS
- TypeScript
- Express 5
- Azure SQL / SQL Server
- `mssql` with parameterized SQL
- Ajv / JSON Schema validation
- OpenAPI 3.x
- Vitest + Supertest
- Azure Blob Storage only for Project 3
- No ORM in Week 1
- No polished UI required
- No Entra/OAuth work in Week 1
- No AI business decision-making in Week 1

## Working Rule

**Simple → Small → Buildable → Testable → Verifiable**

Only mark work complete after it is tested and evidence is recorded.

## Repository Structure

- `MASTER-BUILD-PLAN.md` — execution order and build units
- `PROGRESS-TRACKER.md` — status of every build unit
- `CURRENT-CONTEXT.md` — resume point for a new AI/chat session
- `CAPABILITY-MATRIX.md` — Week 1 capability/evidence coverage
- `project-01-business-record-api/`
- `project-02-state-machine/`
- `project-03-document-evidence-store/`
- `project-04-idempotent-processor/`
- `evidence/`

## Status

Current build unit: **0.1 Repository Bootstrap**

Next: create the Week 1 planning/tracker structure, then initialize the Node.js 22 + TypeScript + Express + Vitest baseline.
