# Tools and Utilities – Approver Assignment

Utilities that support approver validation during Foundations.

## PowerShell

### analysis/timesheet_process/shared/agents/foundation/approver_assignment/agent-execution.ps1
- Purpose: Replays the original agent run that scaffolded this subprocess; use it to regenerate status JSON after significant documentation changes.
- Usage: `pwsh ./analysis/timesheet_process/shared/agents/foundation/approver_assignment/agent-execution.ps1 -Action verify`
- Parameters: `-Action` supports `execute` (full rebuild) or `verify` (lightweight checks).

## Python

### analysis/timesheet_process/shared/context_index.py
- Purpose: Prints the consolidated context manifest; confirms WF-01/WF-03 assets remain indexed for agents.
- Usage: `python3 analysis/timesheet_process/shared/context_index.py --pretty`

### analysis/timesheet_process/shared/extract_project_configuration_context.py
- Purpose: Regenerates property/association tables that approver assignment references.
- Usage: `python3 analysis/timesheet_process/shared/extract_project_configuration_context.py`
- Note: Run before updating property maps to ensure IDs and schemas are aligned.

## HubSpot CLI / API

### scripts/hubspot/node/context/generate-system-context.js
- Purpose: Export latest workflow JSON (IDs 567275018, 567293814, 567363849) to `data/raw/workflows/` for documentation review.
- Usage: `node scripts/hubspot/node/context/generate-system-context.js --export=workflows --ids=567275018,567293814,567363849`

_Last updated: 2025-09-18._

