# Week 1 Capability Coverage Matrix

This matrix is for Week 1 only. The complete program contains fifteen common capabilities across seven weeks; Week 1 focuses on the Data + API + State baseline.

| Capability / Learning Target | Primary Project | Build Unit | Required Evidence |
|---|---|---|---|
| REST/HTTP, JSON, OpenAPI, errors, validation | Business Record API | 1.2-1.4 | Contract-driven API; invalid payloads rejected predictably |
| Relational tables, PK/FK, uniqueness, parent/child | Business Record API | 1.1 | Normalized SQL rows; no orphan/duplicate data |
| Persistent state and legal transitions | State Machine | 2.1-2.2 | Data-driven transition rules; invalid transition rejected |
| Atomic state/history | State Machine | 2.3 | State + history both commit or neither commits |
| Competing state changes | State Machine | 2.4 | At most one incompatible branch wins |
| Structured vs unstructured storage | Document Evidence Store | 3.1 | SQL metadata + Azure Blob bytes |
| Evidence integrity and provenance | Document Evidence Store | 3.2-3.3 | SHA-256; exact byte retrieval |
| Cross-store partial failure | Document Evidence Store | 3.4 | Cleanup/reconciliation policy demonstrated |
| Canonical request fingerprint | Idempotent Processor | 4.1 | Equivalent payload ordering gives same fingerprint |
| Duplicate/retry safety | Idempotent Processor | 4.2-4.5 | Same logical result; no second business effect |
| Continuous negative testing | All four | All | Required failure cases captured as evidence |
| ERP architecture judgment | All four | 5.2 | Design decisions, rejected alternative, ERP inheritance note |
