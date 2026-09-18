# Project 1 Learnings

## Design decisions
1. Azure SQL is the authoritative store; headers and lines are normalized into separate tables.
2. API validation happens before persistence, while PK/FK/unique/check constraints remain the final integrity boundary.
3. Header plus initial lines are created in one SQL transaction so partial business requests are not accepted.

## Rejected alternative
Storing the request as one JSON payload was rejected because it hides relational constraints and makes ERP querying/integrity weaker.

## ERP V2 carry-forward
Business objects need explicit contracts, relational integrity, predictable errors, and durable restart-safe persistence.
