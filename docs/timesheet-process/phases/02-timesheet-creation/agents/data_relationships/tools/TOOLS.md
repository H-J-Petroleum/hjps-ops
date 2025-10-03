# Tools & Checks

| Tool | Purpose | Usage |
| --- | --- | --- |
| `analysis/timesheet_process/shared/verification/verify_phase.py` | Confirms all Phase 02 documentation references (forms, modules, workflows, schema files) resolve correctly. | `python analysis/timesheet_process/shared/verification/verify_phase.py --trace analysis/timesheet_process/phases/02-timesheet-creation/TRACE.md --phase-dir analysis/timesheet_process/phases/02-timesheet-creation --log-dir analysis/timesheet_process/phases/02-timesheet-creation/verification/logs` |
| `python scripts/check_array_lengths.py` (future) | Validate `cg_*` arrays share consistent lengths before WF-11 runs. | Add to `analysis/timesheet_process/shared/verification` and run as part of pre-verification. |
| HubSpot schema exports | Ensure association IDs and property types remain unchanged after HubSpot updates. | Re-run exporter and diff against `data/raw/ai-context/ai-context-export/data-model`. |


