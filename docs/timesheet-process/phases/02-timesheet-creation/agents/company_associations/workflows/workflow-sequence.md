# Workflow Sequence

## WF-11 Insert Line Items Association Steps
- **Lookup consultant project context:** Searches `hj_consultants` for matching `consultant_id` and `hj_project_id` to pull deal IDs, well assignments, and pricing.
- **Map association properties:** For each line item, sets `timesheet_project_id`, `timesheet_payment_deal_id`, `timesheet_sales_deal_id`, `timesheet_consultant_id`, and `timesheet_consultant_email`.
- **Generate descriptions:** Builds `bill_description` using well and date data so billing has project context.
- **Batch create:** Calls HubSpot CRM batch API to create `hj_timesheets` records, then patches `timesheet_unique_id` for deterministic lookups.

## WF-12 Delete Line Items Association Cleanup
- **Enrollment:** When `timesheet_trigger_status` = `Delete Existing` and ID known.
- **Action:** DELETE request removes `hj_timesheets` record, clearing associated relationships.
- **Prereq:** Portal forms must set `timesheet_trigger_status` appropriately to prevent accidental deletions.

_No Phase 02 workflow directly manipulates Phase 03 approvals; focus remains on maintaining accurate associations for downstream consumption._
