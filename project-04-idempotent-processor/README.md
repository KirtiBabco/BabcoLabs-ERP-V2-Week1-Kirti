# Project 4 — Idempotent Request Processor

Purpose: prove that repeated delivery does not create repeated business effects.

Minimum evidence:
- stable canonical request fingerprint;
- unique idempotency key in Azure SQL;
- first request creates one inventory adjustment;
- same key + same payload returns the original result;
- same key + different payload returns conflict;
- ten concurrent duplicate calls still create exactly one adjustment;
- retry after simulated lost response returns the original result.
