# Tools & Checks

| Tool | Purpose | Usage |
| --- | --- | --- |
| `analysis/timesheet_process/shared/verification/verify_phase.py` | Confirms trace references (forms, modules, workflows) match exports before advancing to WF-11 work. | `python analysis/timesheet_process/shared/verification/verify_phase.py --trace analysis/timesheet_process/phases/02-timesheet-creation/TRACE.md --phase-dir analysis/timesheet_process/phases/02-timesheet-creation --log-dir analysis/timesheet_process/phases/02-timesheet-creation/verification/logs` |
| `data/raw/hubspot-cms-api/forms/cms_forms_data.json` | Source of Notify Consultant form definition and `cg_*` field metadata. | Parse with  or Python to confirm field names before editing modules/workflows. |
| `data/raw/workflows/v4-flow-567406596.json` | Validates WF-10 actions (association + link generation). | Review source when updating association IDs or link structure. |
| Manual smoke test checklist | Confirm portal access: verify new consultant receives email, link resolves, and Step 0 shows correct projects. | Run after modifying WF-10 or Step 0 module. |


