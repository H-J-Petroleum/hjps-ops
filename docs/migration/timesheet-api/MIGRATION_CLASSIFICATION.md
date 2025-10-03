# Timesheet Asset Migration Classification

Use this checklist when building the dedicated API repositories. It defines which assets move as live code, which copy as documentation/reference, and which can remain archived.

## 1. Runtime Code (migrate as active modules)
- `src/approval-api/` (Express service, routes, middleware, services, tests)
- `src/pdf-generator/` (PDF service, storage adapters, utilities)
- `src/custom-code/` (HubSpot workflow functions)
- `src/utils/getApiAccessToken.js`
- Serverless legacy logic needed for HMAC validation: `serverless/functions/approve-timesheets.js`
- Agent helpers that build/monitor approvals: `scripts/agent-core/timesheet-approval-*.js`
- Core Node scripts from `analysis/issues/2025-09-30-{consultant-api-timesheet,project-service-api,consultant-approval-api}/`
- Key CLI utilities from `scripts/` flagged “Core tooling” in `SCRIPT_AUDIT.md`

## 2. Documentation & Process Guides (copy to docs/analysis in new repo)
- Process overviews: `analysis/timesheet_process/PROCESS-FLOW-COMPLETE.md`, phase docs, `STRUCTURE-STATUS-SUMMARY.md`
- Issue workspaces (retain directory structure under `docs/issues/`):
  - `2025-09-30-project-service-api`
  - `2025-09-30-consultant-api-timesheet`
  - `2025-09-30-consultant-approval-api`
  - `2025-10-01-pdf-approval-summary-units`
- WF-26 implementation references: `docs/wf26-pdf-generation-implementation.md`
- Toolbox & process standards: `docs/standards/toolbox.md`, `docs/processes/*`
- New dependency + script audit docs: `analysis/timesheet_process/TIMESHEET_ASSET_DEPENDENCIES.md`, `SCRIPT_AUDIT.md`

## 3. Reference Data (one-time export, linked in docs)
- `data/raw/themes/Timesheets-Theme/*` (portal templates, CSS, JS)
- `hubspot-structured-data/sandbox/metadata/hj_timesheets_schema.json`
- `scripts/data/raw/hubspot-export/{schemas,data}/hj_{approvals,timesheets}_*.json`
- Workflow JSON exports referenced in issues (`data/raw/workflows/*.json`)
- Snapshot payloads in issue `data/` folders

## 4. Optional / Legacy Utilities (evaluate case-by-case)
- PowerShell scripts marked “Optional” in `SCRIPT_AUDIT.md`
- BAT wrappers once Node CLIs exist
- `scripts/pdf gen/` PHP webhooks (legacy)
- Draft/temp scripts under `scripts/drafts/`
- Archived serverless experiments (`archive/serverless-approach-2025-09-17/`)

## 5. Tasks Before Migration
1. **Tag assets** using this classification in the migration tracker.
2. **Update documentation links** to reflect new repository structure once scaffolding is ready.
3. **Plan parity tests** for migrated runtime code (lint/test workflows, smoke scripts).
4. **Archive legacy utilities** in a clearly labeled folder if they stay behind.
