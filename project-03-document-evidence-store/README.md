# Project 3 — Document Evidence Store

Stores original bytes in Azure Blob Storage and searchable metadata/linkage in Azure SQL.

## Running endpoints
- POST /api/v1/evidence
- GET /api/v1/evidence/{id}
- GET /api/v1/evidence/{id}/content
- GET /api/v1/entities/{entityType}/{entityId}/evidence
- POST /api/v1/evidence/{id}/verify-integrity

Blob names are generated, not user-controlled. SHA-256 and byte length are persisted. If SQL metadata publication fails after Blob upload, the Blob is deleted as compensation.

Azure storage: stw1kirti260918 / week1-evidence
Live acceptance: .github/workflows/week1-live-acceptance.yml
