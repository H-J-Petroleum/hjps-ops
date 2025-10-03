# Timesheet Association Overview

*Details how WF-11 and supporting assets attach timesheet records to projects, consultants, deals, and wells.*

## Purpose
Ensure that every timesheet created in Phase 02 carries the relationships required for approvals, billing, and reporting (project, well, consultant, deals).

## Process Flow
1. Portal Step 1 resolves consultant/project/well context from `hj_consultants`.
2. WF-11 uses that context to set `timesheet_project_id`, `timesheet_payment_deal_id`, `timesheet_sales_deal_id`, and `timesheet_consultant_id` for each line.
3. Contact ↔ Project association 210 (established by WF-10) ensures consultants only submit for authorised projects.
4. WF-12 cleans up associated records when `timesheet_trigger_status` = `Delete Existing` to avoid orphaned associations.

## Integration Points
- `hj_consultants` prices and deal IDs must remain accurate; WF-11 maps them directly to timesheets.
- Association IDs (210 for contact ↔ project, 280 for contact ↔ timesheet) are prerequisites imported from Phase 01 exports.
- Billing scripts later rely on the sales deal and payment deal IDs stamped here.

## Key Assets
- Schema exports in `data/raw/ai-context/ai-context-export/data-model/hj_timesheets-schema-2-26173281.json` and `data/raw/ai-context/ai-context-export/data-model/hj_consultants-schema-2-26103040.json`.
- Workflow `data/raw/workflows/workflow-567497868-v4.json` (WF-11) for creation logic; `data/raw/workflows/v4-flow-567296849.json` (WF-12) for deletions.
- Portal modules `hjp-insert-timesheet-01.module` and `hjp-insert-timesheet-02-01.module` that stage association IDs.
