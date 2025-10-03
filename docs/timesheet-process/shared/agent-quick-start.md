# Agent Quick Start Guide

Fast reference for running documentation agents, regenerating docs, and verifying outputs.

## 30-Second Checklist
- Check overall status: `scripts/agent-utilities/agent-status-monitor.ps1 -Phase all`
- Regenerate phase docs: `npm --prefix config run generate:docs`
- Re-run verification: `python3 analysis/timesheet_process/shared/verification/verify_phase.py --phase <phase>`

## Running Agents & Generators
- **Individual agent:** `pwsh analysis/timesheet_process/phases/<phase>/agents/<agent>/agent-execution.ps1`
- **Dry run:** append `-DryRun`
- **Full phase pass:** `pwsh scripts/agent-core/agent-orchestrator.ps1 -Phase <phase> -ExecutionMode sequential`
- **Regenerate docs:** `npm --prefix config run generate:docs`

## Common Tasks
- Review data architecture before edits: `phases/<phase>/docs/DATA-ARCHITECTURE.md`
- Pull fresh schema snapshots: `python3 analysis/timesheet_process/shared/extract_project_configuration_context.py`
- Update prompt packs: `python3 analysis/timesheet_process/shared/prompt_pack_builder.py <phase> <subprocess> agent`
- Log outstanding work in `phases/<phase>/docs/IMPROVEMENT-PLAN.md`

## Data Extraction Helpers
```powershell
# List HubSpot assets for a pattern
pwsh scripts/hubspot/powershell/data-extraction/extract-all-assets.ps1 -AssetType all -Filter '*approval*' -OutputFormat csv

# Export schema for a specific object
pwsh scripts/hubspot/powershell/data-extraction/extract-schema-data.ps1 -ObjectType hj_projects -PropertyFilter '*'
```

## Verification
```powershell
# Foundations example
python3 analysis/timesheet_process/shared/verification/verify_phase.py --phase 01-foundation

# Timesheet creation example
python3 analysis/timesheet_process/shared/verification/verify_phase.py --phase 02-timesheet-creation --trace analysis/timesheet_process/phases/02-timesheet-creation/docs/TRACE.md
```
- Verification logs live under `phases/<phase>/verification/logs/`

## Troubleshooting
- Monitor agents in real time: `scripts/agent-utilities/agent-status-monitor.ps1 -Phase all -RealTime`
- Inspect failure logs: `Get-Content analysis/timesheet_process/shared/agents/*/*/agent-status.json`
- Re-run failed agent after fix: `pwsh analysis/timesheet_process/phases/<phase>/agents/<agent>/agent-execution.ps1`
- Regenerate docs if manual edits were required.

Keep all edits aligned with `shared/source/phases.json` so regenerated docs stay consistent across phases.