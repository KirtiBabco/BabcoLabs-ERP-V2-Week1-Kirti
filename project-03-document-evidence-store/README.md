# Project 3 — Document Evidence Store

Purpose: prove the correct storage boundary between Azure Blob Storage and Azure SQL.

Minimum evidence:
- original file bytes stored in Blob Storage;
- SQL stores metadata/reference, not raw bytes/base64;
- generated safe blob key;
- SHA-256 stored and independently re-verified;
- exact original bytes can be retrieved;
- Blob/SQL partial failure cleanup or reconciliation is demonstrated.

No OCR, LLM extraction, summarization, or document rewriting is part of Week 1 scope.
