# Data Relationships Agent Guide

Maintain the object schemas and association references that Foundations workflows rely on.

## Responsibilities
- Keep schema extracts up to date for Deals, HJ Projects, HJ Wells, HJ Consultants, and HJ Approvals.
- Track association type IDs (126, 128, 197–210, etc.) so validation workflows (WF-03, WF-04, WF-05) can verify relationships.
- Flag any schema or association changes in `foundations-build-notes.md` and notify adjacent subprocess owners.

## Pre-Flight Checklist
1. `python3 analysis/timesheet_process/shared/context_index.py --pretty`
2. `python3 analysis/timesheet_process/shared/extract_project_configuration_context.py` (updates property/association tables)
3. Confirm workflow exports for WF-01/03/04/05/06 are present under `data/raw/workflows/`
4. Review `foundations-build-notes.md` for pending schema tasks

## Inputs & Outputs
| Item | Source | Notes |
|---|---|---|
| Schema JSON files | `data/raw/ai-context/ai-context-export/data-model/` | Used to regenerate tables in docs. |
| Association IDs | Workflow exports | Must match WF-03 validation, WF-04/05 creation. |
| Context extract | `generated/project-configuration-context.md` | Currently holds property/association tables; extend as needed. |

## Runbook
1. Regenerate schema/association tables using the extractor script.
2. Update process docs (project configuration, company associations, etc.) if association IDs or schemas change.
3. Cross-check WF-03 history to ensure it still recognizes the association names/IDs.
4. Log any changes in `logs/documentation-run-*.json` and update manifest + build notes.

## Troubleshooting
- **Validation failing:** Verify association IDs haven’t changed in HubSpot (check schema exports after rerunning context index).
- **Missing schema file:** Rerun the HubSpot exporter (`generate-system-context.js --export=schema`).
- **Association added/removed:** Update all dependent docs and notify affected subprocess owners.

_Last updated: 2025-09-18._

