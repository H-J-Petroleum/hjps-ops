# Tools and Utilities – Project Configuration

## PowerShell

### analysis/timesheet_process/shared/agents/foundation/project_configuration/agent-execution.ps1
- Purpose: Replay the original Foundations agent to regenerate status reports.
- Usage: `pwsh ./analysis/timesheet_process/shared/agents/foundation/project_configuration/agent-execution.ps1 -Action verify`
- Notes: Stores output JSON in the `analysis/timesheet_process/shared/agents/foundation/project_configuration/` folder.

## Python

### analysis/timesheet_process/shared/context_index.py
- Purpose: Validate that Workflow 01/03 assets and CMS modules remain indexed for agents.
- Usage: `python3 analysis/timesheet_process/shared/context_index.py --pretty`

### analysis/timesheet_process/shared/extract_project_configuration_context.py
- Purpose: Regenerate `generated/project-configuration-context.md` tables (properties, associations, workflows).
- Usage: `python3 analysis/timesheet_process/shared/extract_project_configuration_context.py`
- Tip: Run after updating workflows or schema so property mapping stays accurate.

## Node / HubSpot CLI

### scripts/hubspot/node/context/generate-system-context.js
- Purpose: Export workflow JSON for IDs 567275018 and 567293814.
- Usage: `node scripts/hubspot/node/context/generate-system-context.js --export=workflows --ids=567275018,567293814`

_Last updated: 2025-09-18._

