# Timesheet & Approval Script Audit (2025-10-03)

This audit captures all `scripts/` assets that touch the timesheet lifecycle. Use it to decide which utilities migrate with the new API repositories and which stay as historical references.

## Timesheet-Focused Scripts

| Path | Purpose / Notes | Migration Disposition |
| --- | --- | --- |
| `scripts/create-minimal-timesheet.js` | Creates bare-bones `hj_timesheets` object for testing; paired BAT wrapper. | Core tooling – migrate. |
| `scripts/add-missing-timesheet-properties.js` | Ensures required properties exist on timesheet object. | Core tooling – migrate alongside schema checks. |
| `scripts/check-timesheet-properties.js` | Pulls sandbox schema to validate property coverage. | Core tooling – migrate. |
| `scripts/check-timesheet-ids.ps1` | PowerShell inspection of timesheet IDs. | Optional – keep if Windows automation required. |
| `scripts/investigate-timesheet-schema.js` | Deep schema explorer for timesheets. | Core tooling – migrate. |
| `scripts/update-timesheet-properties.js` | Batch property updates on timesheets. | Core tooling – migrate. |
| `scripts/update-timesheet-simple.js` | Simplified property updater (likely legacy). | Historical unless still used. |
| `scripts/fix-timesheet-ids-property.js` | Fixes malformed ID arrays. | Core tooling – migrate. |
| `scripts/find-timesheets-by-project.ps1` | PowerShell helper for reporting by project. | Optional – document usage. |
| `scripts/drafts/temp/list-beta-timesheet-props.js` | Draft diagnostics. | Historical. |
| `scripts/drafts/temp/get-beta-timesheet-props.ps1` | Draft diagnostics. | Historical. |
| `scripts/agent-core/timesheet-approval-build-assets.js` | Agent orchestration for approval collateral. | Core tooling – migrate with agent suite. |
| `scripts/agent-core/timesheet-approval-audit.js` | Agent audit utility. | Core tooling – migrate. |

*Data exports:* `scripts/data/raw/hubspot-export/{schemas,data}/hj_timesheets_*.json` — retain as historical reference (copy once).

## Approval-Focused Scripts

| Path | Purpose / Notes | Migration Disposition |
| --- | --- | --- |
| `scripts/create-minimal-approval.js` (+`.bat`) | Minimal approval object creator. | Core. |
| `scripts/create-new-approval.ps1` | PowerShell approval creation. | Optional. |
| `scripts/create-approval-correct.ps1` | Fixes older creation flow. | Historical unless still referenced. |
| `scripts/update-approval-properties.js` | Batch property updater. | Core. |
| `scripts/update-approval-with-contact.js` | Associates contact to approval. | Core. |
| `scripts/update-approval-with-existing-contact.js` | Variant of above. | Core. |
| `scripts/restore-approval-properties.js` | Restores property sets. | Core. |
| `scripts/quick-fix-populate-approval*.ps1` | Emergency fixes. | Historical. |
| `scripts/sandbox-seed-approval.js` | Seeds sandbox approvals. | Core. |
| `scripts/test-real-approval*.{js,bat}` / `test-simple-approval.js` | Manual test harnesses; keep representative JS versions, retire BAT if redundant. | Migrate JS, document BAT. |
| `scripts/test-real-approval-api.js` | Direct API smoke test. | Core. |
| `scripts/test-production-approvals.js` | Production diagnostics. | Core (lock behind safeguards). |
| `scripts/test-production-approval-lookup.js` | Lookup helper. | Core. |
| `scripts/test-minimal-approval*.ps1` | PowerShell test flows. | Optional. |
| `scripts/test-approval-properties.js` (+`.bat`) | Validates schema. | Core (JS). |
| `scripts/test-working-approval.js` (+`.bat`) | Workflow validation. | Core (JS). |
| `scripts/test-sandbox-approval.js` | Sandbox smoke test. | Core. |
| `scripts/test-real-approval-detailed.js` | Extended logging. | Core. |
| `scripts/start-approval-api-production.{ps1,bat}` | Launch scripts. | Migrate after converting to new repo’s commands. |
| `scripts/search-approval-objects.ps1` | Search utility. | Optional. |
| `scripts/find-recent-approvals.ps1` (+HubSpot subfolder variant) | Reporting. | Optional. |
| `scripts/check-approval-schema.ps1` | Schema inspector. | Optional. |
| `scripts/check-approval-properties.js` | Schema inspector (JS). | Core. |
| `scripts/check-contact-approval-data.ps1` | Cross-object inspector. | Optional. |
| `scripts/analyze-approval-request.ps1` | Request analysis. | Historical/Optional. |
| `scripts/debug-approval-service.js` | Debug helper. | Core (pairs with API runtime). |
| `scripts/debug-create-approval-note.js` | Debug. | Core. |
| `scripts/debug-send-approval-email.js` | Debug. | Core. |
| `scripts/debug-approval-update.ps1` | PowerShell debug. | Optional. |
| `scripts/examine-approval-object.ps1` | Inspector. | Optional. |
| `scripts/list-sandbox-approvals.js` | Listing utility. | Core. |
| `scripts/pdf gen/webhook-approvals.php` | Legacy webhook handler. | Historical.
| `scripts/pdf gen/webhook-approval-pdfgen.php` | Legacy webhook handler. | Historical.
| `scripts/hubspot/powershell/api/*.ps1` | Older PowerShell API flows (diagnostics). | Historical unless still invoked.
| `scripts/fixes/populate-approval-object.ps1` | Legacy fix. | Historical.
| `scripts/drafts/temp/*` | Draft diagnostics. | Historical.

*Data exports:* `scripts/data/raw/hubspot-export/{schemas,data}/hj_approvals_*.json` — keep once as reference.

## Shared / Cross-Cutting
- Launch & environment: `scripts/start-pdf-generator.ps1`, `scripts/start-pdf-generator-sandbox.ps1`
- Verification suites: `scripts/run-verification.bat`, `scripts/run-scope-verification.ps1`
- Agent tooling overlaps: `scripts/agent-core/*`

## Follow-Up
1. Confirm which PowerShell utilities remain active; if required, plan cross-platform equivalents in the new repo.
2. De-duplicate legacy BAT wrappers once Node-based CLI flows replace them.
3. Tag each core script in the migration tracker with the stage it supports (see `TIMESHEET_ASSET_DEPENDENCIES.md`).
