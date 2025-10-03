# Cross-References – Data Relationships

## Upstream Dependencies
- Context extract scripts that export HubSpot schemas and association IDs.
- Workflows 01/03/04/05 supplying or relying on those associations.

## Downstream Dependencies
- Approval, billing, and notification phases which expect associations documented here to exist.

## Integration Points
- Script `analysis/timesheet_process/shared/extract_project_configuration_context.py` outputs property and association tables consumed by multiple subprocesses.
- Workflow validation rules should reference this document when IDs or schema paths change.

Last updated: 2025-09-18

