# Evidence — BU 0.3 Environment Baseline

Status: **Verified Complete**

## Verified
- `.env.example` documents required Week 1 environment variable names without real secrets.
- `.gitignore` excludes `.env` and environment-specific secret files.
- `src/config/env.ts` fails fast when required environment variables are missing.
- Automated tests cover missing and present SQL connection-string behavior.

## CI Evidence
Workflow: `Week 1 Smoke`
Run ID: `34966225158`
Job: `build-and-test`
Conclusion: **success**

No real Azure SQL or Azure Storage credential is committed to this repository.
