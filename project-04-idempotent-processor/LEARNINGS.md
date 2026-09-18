# Project 4 Learnings

1. Duplicate delivery is normal; protect the business effect, not the submit button.
2. A durable unique idempotency key plus canonical payload fingerprint distinguishes replay from conflict.
3. Idempotency record and business effect must be protected by one database transaction/concurrency strategy.

Rejected: SELECT-then-INSERT without a unique key/transaction and in-memory key caches.

ERP V2 carry-forward: the practical guarantee here is at-most-once SQL business effect under repeated request delivery, not exactly-once networking.
