# Asset Inventory

| Asset | Type | Description | Reference |
| --- | --- | --- | --- |
| WF-11 `Insert Line Items` | Workflow export | Custom code that builds `hj_timesheets` records from contact staging arrays. | `data/raw/workflows/workflow-567497868-v4.json` |
| WF-12 `Delete Line Items` | Workflow export | Removes `hj_timesheets` records when `timesheet_trigger_status` = `Delete Existing`. | `data/raw/workflows/v4-flow-567296849.json` |
| Phase 02 trace | Documentation | Illustrates how portal steps feed WF-11/WF-12 and where approvals take over. | `analysis/timesheet_process/phases/02-timesheet-creation/TRACE.md` |
| Portal staging modules | CMS modules | Provide the `cg_*` values WF-11 expects (e.g., `hjp-insert-timesheet-02-01.module`). | `data/raw/hubspot-cms-assets/Timesheets-Theme/modules/hjp-insert-timesheet-02-01.module` |

