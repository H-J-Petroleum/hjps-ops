# Approver Assignment Agent Guide

Coordinate the automation and data checks that guarantee each deal has a valid approver before project creation.

## Workflow Responsibilities
| ID | Name | What to monitor |
|---|---|---|
| 567275018 | 01. Update Recruiting Deal | Confirms consultant metadata/URLs are generated and consultant isn’t tagged as approver. |
| 567293814 | 03. Update Sales Deal & Create Custom Project Object | Blocks deals if Approver association missing or conflicts exist (`missing_important_info` → “Yes”). |
| 567363849 | 06. Associate Consultant to a New Sales Deal | After the assignment form submits, ensures association type 4 is created and doesn’t collide with approver/primary contacts. |

## Pre-Flight Checks
- `python3 analysis/timesheet_process/shared/context_index.py --pretty`
- Review workflow JSON exports:
  - `data/raw/workflows/workflow-03-567293814-v4.json`
  - `data/raw/workflows/v4-flow-567363849.json` *(rerun exporter if missing)*
- Confirm the assignment form (`f1784acd-d74d-441e-b5e5-c0c4fbbf2f5e`) and modules (`hjp-assign-consultant-to-new-deal-*`) exist under `data/raw/`.
- Cross-check the Foundations build notes for open issues.

## Inputs & Outputs
- **Inputs:** Sales deals in Quote Review / Closed Won, consultant and company associations, approver contact details.
- **Outputs:** Deals with approver label set, conflict notes resolved, project creation able to proceed.

### Critical Fields & Associations
| Item | Source | Notes |
|---|---|---|
| Approver association (label **Approver**) | WF-03 | Deal cannot remain Closed Won without it. |
| `missing_important_info` / `deal_error_note_id` | WF-03 action 1 | Use the note link to see which prerequisite failed. |
| Consultant association (Association type 4) | WF-06 | Must not collide with approver or primary contact. |
| Assignment form (`f1784acd-d74d-441e-b5e5-c0c4fbbf2f5e`) | WF-06 enrollment | Required properties: `sales_deal_id_to_be_assigned`, `unique_project_id_from_sales_deal`. |

## Runbook
1. **Inspect validation failures** – review WF-03 history (`missing_important_info`, error note) to see if approver, customer, operator, or owner is missing/conflicting.
2. **Check consultant assignment** – confirm WF-06 successfully created association type 4 and that consultant ≠ approver/primary contact.
3. **Fix associations** – add/update CRM labels (Approver, Primary) as needed; resolve duplicate contact roles.
4. **Re-run WF-03** – re-enroll the deal or push stage change; confirm flag stays “No”.
5. **Record run** – update `logs/documentation-run-*.json`, `foundations-build-notes.md`, and manifest if assets changed.

## Troubleshooting
- **Deal keeps reverting stages:** Approver label missing; add the association and re-run WF-03.
- **Approver = consultant:** Update associations to separate roles; WF-03 conflict check will otherwise fail.
- **Assignment workflow not firing:** Ensure form `f1784acd-d74d-441e-b5e5-c0c4fbbf2f5e` is still published and the contact has `sales_deal_id_to_be_assigned` populated.

---
_Last regenerated: 2025-09-18._

