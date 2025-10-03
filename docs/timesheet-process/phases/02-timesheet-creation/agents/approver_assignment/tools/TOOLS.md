# Tools & Checks

| Tool | Purpose | Usage |
| --- | --- | --- |
| `analysis/timesheet_process/shared/verification/verify_phase.py` | Validates that approval forms and modules referenced in the trace exist in exports before staging updates. | `python analysis/timesheet_process/shared/verification/verify_phase.py --trace analysis/timesheet_process/phases/02-timesheet-creation/TRACE.md --phase-dir analysis/timesheet_process/phases/02-timesheet-creation --log-dir analysis/timesheet_process/phases/02-timesheet-creation/verification/logs` |
| `data/raw/hubspot-cms-api/forms/cms_forms_data.json` | Inspect approval form field definitions (`approval_*`, `approver_*`). | `python -m json.tool data/raw/hubspot-cms-api/forms/cms_forms_data.json | Select-String "approval_timesheet_ids_array"` |
| `data/raw/workflows/workflow-567497868-v4.json` | Provides context on how WF-11 expects `cg_*` arrays before approval handoff. | Review when adjusting staging arrays or adding new fields. |
| Manual smoke test | Confirm Request/Resubmit forms populate `approval_timesheet_ids_array` and update `hj_timesheets.timesheet_approval_status`. | Submit a test batch, monitor contact properties, ensure Phase 03 updates status. |


