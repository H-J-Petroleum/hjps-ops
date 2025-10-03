# Tools & Checks

| Tool | Purpose | Usage |
| --- | --- | --- |
| `analysis/timesheet_process/shared/verification/verify_phase.py` | Confirms WF-11/12 and module references in the trace resolve to actual exports. | `python analysis/timesheet_process/shared/verification/verify_phase.py --trace analysis/timesheet_process/phases/02-timesheet-creation/TRACE.md --phase-dir analysis/timesheet_process/phases/02-timesheet-creation --log-dir analysis/timesheet_process/phases/02-timesheet-creation/verification/logs` |
| `python scripts/check_timesheet_associations.py` (to create) | Iterate over `hj_timesheets` export to confirm `timesheet_project_id` and `timesheet_sales_deal_id` populated. | Prototype script under `analysis/timesheet_process/shared/verification`. |
| Manual CRM audit | Spot check consultant records to confirm contact ↔ project association 210 exists. | Use HubSpot CRM associations view before enabling submissions for new consultants. |


