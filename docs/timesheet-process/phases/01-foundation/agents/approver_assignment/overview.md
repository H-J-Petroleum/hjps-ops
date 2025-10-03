# Approver Assignment – Foundations Overview

This subprocess ensures every deal has a qualified approver before it can remain in Quote Review or Closed Won. It works hand-in-hand with Workflow 03, which blocks project creation unless the approver association is present and valid.

## Workflow Sequence
1. **WF-01 – Update Recruiting Deal (ID 567275018)**
   - Generates consultant metadata and the assignment URLs; ensures the consultant isn’t also the approver.
2. **WF-03 – Update Sales Deal & Create Custom Project Object (ID 567293814)**
   - Validates that an approver contact is associated (label **Approver**) and not the same as consultant or primary contact.
   - If the approver is missing or conflicts exist, the deal is rolled back and a detailed error note is logged.
3. **WF-06 – Associate Consultant to a New Sales Deal (ID 567363849)**
   - Creates the consultant association after the assignment form (`f1784acd-d74d-441e-b5e5-c0c4fbbf2f5e`) is submitted; WF-03 ensures the approver remains distinct.

Consultant readiness is handled in project configuration; this subprocess focuses on the approver contact path so WF-03 passes the gate.

## Success Criteria
- Approver contact associated with the correct label before the deal stays Closed Won.
- WF-03 run history stays in “Complete” state (no `missing_important_info`).
- Conflict checks enforced: approver ≠ consultant, approver ≠ primary contact.
- Assignment modules (`hjp-assign-consultant-to-new-deal-0*`) continue to surface the approver and consultant roles correctly.

## References
- `analysis/process-analysis/comprehensive-process-map.md` (Workflows 01, 03, 06)
- CRM opportunity guide PDF for deal-stage actions (`docs/assets/CreatingAnOpportunityinHubSpotForDrillingFluids-07b7a33a-3f62-4d20-8e07-d7610.pdf`)
- Workflow JSON: `data/raw/workflows/workflow-03-567293814-v4.json`, `workflow-06-567363849-v4.json`

---
_Last aligned with context index: 2025-09-18._
