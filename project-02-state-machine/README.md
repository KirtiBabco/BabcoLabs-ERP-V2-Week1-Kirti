# Project 2 — Reusable State Machine

A configuration-driven workflow service implemented in the shared Week 1 runtime.

## Running endpoints
- GET /api/v1/workflow-definitions
- POST /api/v1/workflow-instances
- GET /api/v1/workflow-instances/{id}
- POST /api/v1/workflow-instances/{id}/transitions
- GET /api/v1/workflow-instances/{id}/history

## Design
Workflow rules are stored in SQL as definitions, states and transitions. The same engine runs Approval, Issue Resolution, Document Review, and the fourth data-only Release Lifecycle workflow. Accepted state change + history append use one SERIALIZABLE SQL transaction with row locks and expectedCurrentState protection.

## Acceptance
Live workflow: .github/workflows/week1-live-acceptance.yml
