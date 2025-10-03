# Tools & Checks

| Tool | Purpose | Usage |
| --- | --- | --- |
| `analysis/timesheet_process/shared/verification/verify_phase.py` | Ensures workflow IDs noted in TRACE exist and schema references resolve. | `python analysis/timesheet_process/shared/verification/verify_phase.py --trace analysis/timesheet_process/phases/02-timesheet-creation/TRACE.md --phase-dir analysis/timesheet_process/phases/02-timesheet-creation --log-dir analysis/timesheet_process/phases/02-timesheet-creation/verification/logs` |
| Workflow export diff | Detect unintended changes to WF-11/WF-12 custom code. | `diff data/raw/workflows/workflow-567497868-v4.json path/to/new-export.json` |
| Script idea: `check_wf11_inputs.py` | Validate required `cg_*` fields exist before running WF-11. | Build under `analysis/timesheet_process/shared/verification` and call from agent workflows. |


