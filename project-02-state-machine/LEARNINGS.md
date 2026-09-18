# Project 2 Learnings

1. Current state is not history; both need separate durable representations.
2. Legal transitions are data, not UI buttons or workflow-specific switch statements.
3. expectedCurrentState plus transaction locking prevents stale or competing callers from silently overwriting state.

Rejected: one custom if/switch tree per workflow.

ERP V2 carry-forward: state changes must be server-owned, auditable, atomic and concurrency-aware.
