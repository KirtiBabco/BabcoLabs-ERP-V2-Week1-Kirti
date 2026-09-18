# Project 3 Learnings

1. Blob Storage owns original unstructured bytes; SQL owns metadata, indexes and business linkage.
2. Original filename is descriptive only; generated blob identity prevents path traversal and filename collisions.
3. SHA-256 over actual bytes provides an independently checkable integrity proof.

Rejected: storing base64/varbinary evidence in ordinary relational columns.

ERP V2 carry-forward: immutable evidence and searchable business metadata need different storage responsibilities and explicit cross-store failure handling.
