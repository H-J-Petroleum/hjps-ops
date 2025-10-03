# Tools and Utilities – Data Relationships

## Python

### analysis/timesheet_process/shared/context_index.py
- Purpose: Verifies association metadata is in the shared manifest.
- Usage: python3 analysis/timesheet_process/shared/context_index.py --pretty

### analysis/timesheet_process/shared/extract_project_configuration_context.py
- Purpose: Regenerates property and association tables for all Foundations subprocesses.
- Usage: python3 analysis/timesheet_process/shared/extract_project_configuration_context.py

## Node / HubSpot CLI

### scripts/hubspot/node/context/generate-system-context.js
- Purpose: Export latest schema and association data; use --export=schema when IDs change.
- Usage: node scripts/hubspot/node/context/generate-system-context.js --export=schema

Last updated: 2025-09-18

