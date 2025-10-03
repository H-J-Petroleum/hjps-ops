# Approver Assignment Backend Implementation Guide

Use this guide when adjusting the automation that validates approver data during the Foundations phase. It expands on `backend/backend-implementation.md` with concrete workflow steps, payloads, and guardrails.

## 1. Workflow Deep Dive

### WF-01 – Update Recruiting Deal (`567275018`)
- **Trigger:** Recruiting pipeline deals entering *Qualified* stages.
- **Key Actions:**
  - Copy consultant contact metadata (`consultant_full_name`, `consultant_email`, `consultant_unique_id`).
  - Generate assignment URLs (`assign_consultant_to_a_new_sales_deal`, `link_for_consultant`).
  - Write helper flags that downstream workflows use to prevent consultants from also occupying the Approver role.
- **Impact on Approver Assignment:** These values later populate the consultant-facing modules and let WF-03 compare consultant IDs vs. approver IDs.

### WF-03 – Update Sales Deal & Create Custom Project Object (`567293814`)
- **Trigger:** Sales deals entering *Quote Review* or *Closed Won*.
- **Validation Steps:**
  1. Fetch associated contacts and verify an Approver-labelled contact exists.
  2. Compare approver contact ID to consultant and primary contact IDs; set `missing_important_info` when conflicts occur.
  3. Log failures in `deal_error_note_id` so sales/operations can fix associations.
- **Outputs:** Writes customer/operator metadata, refreshes consultant URLs, and prepares the “Create/Associate Well” link.

### WF-06 – Associate Consultant to a New Sales Deal (`567363849`)
- **Trigger:** Submission of the consultant assignment form (`f1784acd-d74d-441e-b5e5-c0c4fbbf2f5e`).
- **Actions:**
  - Create association type 4 (Deal ↔ Consultant contact).
  - Update display names and consultant titles used in approvals.
  - Re-validate that the consultant ID does not match the associated approver.

## 2. Data Contracts
| Object | Key Properties | Source Workflow |
| --- | --- | --- |
| Deal | `missing_important_info`, `deal_error_note_id`, `assign_consultant_to_a_new_sales_deal`, `link_for_consultant` | WF-03, WF-01 |
| Contact (Approver) | `email`, `firstname`, `lastname`, `vid` | CRM association (label **Approver**) |
| Custom Object (HJ Projects) | `hj_approver_email`, `hj_approver_is`, `hj_approver_name` | Populated downstream when WF-03 succeeds |

Keep property names synchronized with `properties/property-mapping.json` for downstream documentation consumers.

## 3. Implementation Checklist
1. **Export validation:** Ensure `data/raw/workflows/workflow-03-567293814-v4.json` and `data/raw/workflows/v4-flow-567363849.json` exist and are current.
2. **Association audit:** Use HubSpot to confirm the Approver label is present on the contact association and does not collide with the Consultant label.
3. **Conflict test:** Re-run WF-03 on a staging deal without an approver; verify it resets the stage and records the error note.
4. **Success test:** Associate a valid approver and re-run WF-03; confirm `missing_important_info` stays "No".
5. **Documentation:** Update `analysis/timesheet_process/shared/foundations-build-notes.md` and `logs/documentation-run-*.json` after changes.

## 4. Troubleshooting Playbook
- **No approver found:** Add the contact with label **Approver** to the deal, then rerun WF-03.
- **Approver equals consultant:** Update deal associations so consultant and approver contacts differ; WF-03 will halt progress otherwise.
- **Consultant form triggers but WF-06 fails:** Confirm the form still submits `sales_deal_id_to_be_assigned` and `unique_project_id_from_sales_deal`. Missing tokens prevent the association from being created.

## 5. Future Enhancements
- Implement automated alerts when WF-03 toggles `missing_important_info` to "Yes" more than twice for the same deal.
- Store approver history on a custom object to track reassignment trends.
- Surface approver validation status on the sales dashboard via calculated properties once Phase 03 finishes hardening.

_Last updated: 2025-09-18._

