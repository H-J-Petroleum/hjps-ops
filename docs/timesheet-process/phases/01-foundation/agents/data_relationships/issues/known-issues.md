# Known Issues – Data Relationships (Foundations)

## Current Issues

### 1. Association Type IDs Drift After HubSpot Schema Migration
- Description: Recent schema exports changed association IDs for project ↔ consultant, but workflows still reference the old IDs.
- Impact: WF-03 and project creation fail to create the correct links, breaking approvals.
- Status: Open
- Resolution: Rerun the schema exporter, update association mappings in workflows and this document; notify Approval phase maintainers.

### 2. Context Extract Out of Date
- Description: Generated context file was not refreshed after new properties added to HJ Projects.
- Impact: Agents operate on stale property lists, omitting required fields during documentation updates.
- Status: Open
- Resolution: Run extract_project_configuration_context.py and commit the refreshed context file.

## Resolved Issues

_None logged yet._

Last updated: 2025-09-18
