# Cross-References – Workflow Configuration (Foundations)

Foundations maintains prerequisites only; approval workflows stay disabled until Phase 03.

## Upstream Dependencies
- Project configuration must resolve the validation flag (missing_important_info) before any approval workflow can activate.
- Company associations and data relationships provide operator/customer context consumed by approval automation.

## Downstream Dependencies
- Approval process (phases/03-approval) owns enablement and ongoing maintenance of the approval workflows catalogued here.

## Integration Notes
- Track workflow IDs 1680618036 and 1682422902; confirm exports exist before handoff (see generated context warning).
- Log any configuration updates required prior to activation in the workflow issues file.

Last updated: 2025-09-18
