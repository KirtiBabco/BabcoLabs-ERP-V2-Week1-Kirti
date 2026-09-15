# Project 2 — State Machine Service

Purpose: prove that workflow state is server-owned, persisted, data-driven, transactional, and concurrency-safe.

Minimum evidence:
- workflow definitions/states/transitions stored as data;
- valid transitions accepted;
- invalid/stale transitions rejected;
- state + immutable history change atomically;
- competing incompatible transitions allow at most one winner.

Implementation starts after the common baseline and Project 1 learning foundation are verified.
