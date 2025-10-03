# Timesheet Lifecycle Asset Dependency Map

This document links the critical assets that power the H&J Petroleum timesheet lifecycle from deal inception through billing. Use it when migrating automation into the new API-first repository so each stage retains the code, scripts, and documentation it depends on.

## 0. Strategy & Data Governance
- High-level flow: `analysis/timesheet_process/PROCESS-FLOW-COMPLETE.md`
- Phase references: `analysis/timesheet_process/phases/*/docs/DATA-ARCHITECTURE.md`, `IMPROVEMENT-PLAN.md`, `TRACE.md`
- Toolbox policy: `docs/standards/toolbox.md`
- Process quick refs: `docs/processes/timesheet-process-guidelines.md`, `timesheet-approval.md`

## 1. Deal Creation & Project Bootstrap
- Automation workspace: `analysis/issues/2025-09-30-project-service-api/`
  - Context collectors: `collect-upstream-context.mjs`, `collect-project-service-context.mjs`
  - Creation scripts: `create-project.mjs`, `assign-consultants-to-project.mjs`, `create-service.mjs`, `assign-service-to-deal.mjs`
  - Scope creation: `create-scope-of-work.mjs`
  - Plans: `implementation-plan.md`, `bootstrap-plan.md`
- Seed helpers: `scripts/seed-sales-deal.mjs`, `scripts/seed-company.mjs`, `scripts/create-simple-project.js`
- Schema discovery: `scripts/discover-real-production-objects.js`

## 2. Well & Consultant Associations
- Association matrix: `analysis/issues/2025-09-30-project-service-api/associations.md`
- Foundations trace: `analysis/timesheet_process/phases/01-foundation/docs/FOUNDATIONS-TRACE.md`
- Verification: `scripts/run-scope-verification.ps1`, `scripts/verify-scope-approval-process.js`

## 3. Service Definition & Scope of Work
- Phase documentation: `analysis/timesheet_process/phases/01-foundation/docs/UI-UX-RECOMMENDATIONS.md`
- Automation scripts (above) plus context fixtures in `analysis/issues/2025-09-30-project-service-api/data/`

## 4. Timesheet Entry
- Portal exports: `data/raw/themes/Timesheets-Theme/*` (JS, CSS, templates), `hubspot-structured-data/sandbox/metadata/hj_timesheets_schema.json`
- HubSpot custom code: `src/custom-code/normalizeTimesheet.js`, `formatApprovalEmail.js`
- API tooling: `analysis/issues/2025-09-30-consultant-api-timesheet/` (`build-timesheet-payload.mjs`, `submit-timesheet-payload.mjs`, `validate-prereqs.mjs`)
- Scripts: `scripts/create-minimal-timesheet.js`, `scripts/check-timesheet-properties.js`, `scripts/investigate-timesheet-schema.js`
- Tests / legacy functions: `tests/approve-timesheets.test.js`, `serverless/functions/approve-timesheets.js`

## 5. Approval Request Generation
- Approval issue workspace: `analysis/issues/2025-09-30-consultant-approval-api/`
  - Workflow snapshots: `WF13-action*.js`
  - Payload tooling: `fetch-approval-context.mjs`, `run-approval-request.mjs`
  - Plan & notes: `approval-plan.md`, `notes.md`
- Supporting scripts: `scripts/create-minimal-approval.js`, `scripts/update-approval-properties.js`, `scripts/test-real-approval.js`

## 6. Approval Processing & PDF Generation
- Express service: `src/approval-api/` (`src/index.js`, `src/routes/approval.js`, `src/services/*.js`)
- PDF runtime: `src/pdf-generator/` (`src/services/`, `src/utils/`), documentation `README.md`
- WF-26 implementation notes: `docs/wf26-pdf-generation-implementation.md`
- Recent fixes: `analysis/issues/2025-10-01-pdf-approval-summary-units/`
  - `solution-scaffolding-review.md`, `scripts/fetch-timesheet-units.js`

## 7. Billing Prep & Downstream
- Phase docs: `analysis/timesheet_process/phases/04-billing/docs/`
- Agent automation: `scripts/agent-core/timesheet-approval-*.js`
- Auxiliary scripts: `scripts/populate-and-approve.ps1`, `scripts/test-real-pdf-generation.js`

## Cross-Cutting Infrastructure
- Environment & secrets: `.env.example`, `src/approval-api/.env.example`, `docs/hubspot-integration/token-guide.md`
- Observability & logging: `src/approval-api/src/utils/logger.js`, `src/pdf-generator/src/utils/logger.js`
- Tests & CI hooks: `run-tests.js`, `test-approval-api.js`, `config/package.json` scripts
- Data snapshots: `analysis/issues/*/data/`, `data/raw/hubspot-export/*`

## Next Steps
- Keep this map updated as assets move into the new repository.
- Tag each asset in the migration tracker with its stage and new repo destination (service code vs documentation vs historical reference).
