# Tools and Utilities – Company Associations

## PowerShell

### analysis/timesheet_process/shared/agents/foundation/company_associations/agent-execution.ps1
- Purpose: Replays the Foundations agent to regenerate company association docs/status.
- Usage: run PowerShell: pwsh ./analysis/timesheet_process/shared/agents/foundation/company_associations/agent-execution.ps1 -Action verify

## Python

### analysis/timesheet_process/shared/context_index.py
- Purpose: Confirms workflows and modules are in the shared index.
- Usage: python3 analysis/timesheet_process/shared/context_index.py --pretty

### analysis/timesheet_process/shared/extract_project_configuration_context.py
- Purpose: Refresh association ID tables used across foundations subprocesses.
- Usage: python3 analysis/timesheet_process/shared/extract_project_configuration_context.py

### analysis/timesheet_process/phases/01-foundation/company_associations/tools/validate_wf04_wf05.py
- Purpose: Automated check that WF-04/WF-05 exports contain association IDs 126/128 as expected.
- Usage: python3 analysis/timesheet_process/phases/01-foundation/company_associations/tools/validate_wf04_wf05.py
- Result: Prints validation outcome; returns non-zero exit code if exports are missing or inconsistent.

## Node / HubSpot CLI

### scripts/hubspot/node/context/generate-system-context.js
- Purpose: Export workflow JSON for IDs 567358311 and 567358566.
- Usage: node scripts/hubspot/node/context/generate-system-context.js --export=workflows --ids=567358311,567358566

Last updated: 2025-09-18


