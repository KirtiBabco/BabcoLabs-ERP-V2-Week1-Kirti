# Project 4 — Idempotent Request Processor

Protects one deterministic ERP business effect (inventory adjustment) from duplicate delivery.

## Running endpoints
- POST /api/v1/inventory-adjustments (requires Idempotency-Key)
- GET /api/v1/inventory-adjustments/{adjustmentId}
- GET /api/v1/idempotency/{idempotencyKey}

Meaningful payload fields are canonicalized and SHA-256 fingerprinted. Idempotency reservation, inventory write and durable logical response are coordinated in a SERIALIZABLE SQL transaction. Replay returns the original identity; changed payload under the same key returns 409.

Live acceptance includes sequential replay, 10-way concurrency, JSON property reordering, conflict, lost-response recovery and restart persistence.
