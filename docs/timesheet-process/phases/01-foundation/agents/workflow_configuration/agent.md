# Workflow Configuration Agent Guide (Foundations Handoff)

Foundations does not run approval workflows directly; this area tracks prerequisites before the process transitions to the Approval phase.

## Responsibilities
- Confirm project and association data (from Project Configuration & Company Associations) are complete so approval workflows can stay disabled until needed.
- Record any configuration tasks required before enabling approval workflows in `phases/03-approval`.

## Pre-Flight Check
- `python3 analysis/timesheet_process/shared/context_index.py --pretty`
- Review `analysis/timesheet_process/phases/03-approval/workflows/` to understand what will activate later; no edits should be made from Foundations unless explicitly requested.
- Update `foundations-build-notes.md` if any approval workflow needs prep before the handoff.

## Runbook
1. Verify that all preceding Foundations steps are complete (`missing_important_info` in WF-03 remains “No”).
2. Document any pending tasks or configuration flags required before turning on the approval workflows.
3. No automation is executed here—log “handoff confirmed” in `logs/documentation-run-*.json` if everything is ready.

## Troubleshooting
- If approval workflows are firing prematurely, disable them in `phases/03-approval` and confirm Foundations prerequisites (project data, approver, wells) are met first.

_Last updated: 2025-09-18._

