# Workflow Sequence

## WF-11 Data Flow Highlights
- Reads `cg_*` arrays from the contact and splits them into Python lists for iteration.
- Queries `hj_consultants` to retrieve pricing and associated deal IDs for each well/role combination.
- Constructs `timesheet_project_id`, `timesheet_payment_deal_id`, `timesheet_sales_deal_id`, and `timesheet_consultant_id` before calling the batch create API.
- After creation, patches each record with `timesheet_unique_id` (format `{project_id}-{objectId}`).

## WF-12 Data Flow Highlights
- Enrolls when `timesheet_trigger_status` equals `Delete Existing` and `hs_object_id` is known.
- Issues DELETE request to remove the `hj_timesheets` record, ensuring associations do not linger.

_Both workflows rely on accurate schema exports; rerun verification whenever properties change._
