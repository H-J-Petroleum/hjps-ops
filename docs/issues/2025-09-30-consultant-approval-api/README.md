# Approval API Backfill (2025-09-30)

## Goal
Replicate the WF-13 + portal approval submission via the HubSpot API so large batches of timesheets (e.g., Justin Lott’s 84 lines) can be sent for approval without hitting workflow/module timeouts.

## Current Context
- Timesheets for weeks 2025-09-15 and 2025-09-22 were inserted directly via API (`analysis/issues/2025-09-30-consultant-api-timesheet`).
- Contact `299151` now holds `approval_timesheet_ids_array` (84 IDs) and refreshed date ranges (`09/15/2025 – 09/26/2025`).
- We must trigger the same downstream automation WF-13 expects by submitting the approval request payload ourselves.

## Assets to Review
- `data/raw/workflows/workflow-567497868-v4.json` (timesheet creation logic) — already mapped.
- **WF-13** export (identify ID/path) for approval request handling.
- CMS module `hjp-line-items-approval-01` and related approval response modules — reveals form payload (`response_approval_timesheet_ids_array`, dates, consultant metadata).
- Existing API tooling (`submit-timesheet-payload.mjs`) can be adapted for approval form submission.
- `data/approval-context-*.json` — snapshot of consultant contact, timesheet, sales deal, and approver contact data used for the API workflow.

## To Do
1. Map WF-13 actions (done – see `WF13-action*.js` snapshots and `approval-plan.md`).
2. Gather required contact/timesheet/sales-deal data for Justin Lott (done – captured via `fetch-approval-context.mjs`).
3. Build approval API payloads that replace the form submission (done – `run-approval-request.mjs`).
4. Implement scripts to create the approval object, update timesheets, contacts, deal notes/tasks, and notify via CRM (in progress – internal task branch still pending validation).
5. Execute end-to-end API run; validate marketing email workflows and reminders still trigger (outstanding – need confirmation that marketing email send covers bypass path).
