# Project Configuration – Backend Implementation Guide

This guide expands on `backend/backend-implementation.md`, providing detailed steps for maintaining Workflow 01/03 and the downstream project creation flow.

## 1. Workflow Anatomy

### 01. Update Recruiting Deal (`567275018`)
- **Pipeline:** Recruiting (pipeline ID 8926629).
- **Key actions:**
  - Query the associated consultant contact and copy `consultant_full_name`, `consultant_email`, `consultant_unique_id` onto the recruiting deal.
  - Generate encrypted URLs `assign_consultant_to_a_new_sales_deal` and `link_for_consultant` used by CMS modules.
  - Flag deals where the consultant already appears as an approver so WF-03 can throw a conflict.
- **Maintenance tips:** Verify stage IDs when pipeline stages change; confirm token generation script matches portal domain.

### 03. Update Sales Deal & Create Custom Project Object (`567293814`)
- **Trigger:** Sales deal enters Quote Review or Closed Won.
- **Validation sequence:**
  1. Ensure associations for customer (label **Customer**), operator (label **Operator**), primary contact, approver, and deal owner exist.
  2. Confirm customer company has MSA terms populated.
  3. Compare contact IDs to guarantee approver ≠ consultant/primary contact.
- **Outputs:** Writes customer/operator/deal owner fields for handoff, prepares `create_associate_well` link, and emits `missing_important_info`/`deal_error_note_id` when validation fails.
- **Maintenance tips:** Keep association label names in sync with CRM configuration; rerun exports after any label rename.

### Project Creation Workflow (Workflow Configuration folder)
- **Trigger:** Internal enrollment triggered when WF-03 completes without errors.
- **Actions:** Create `hj_projects` record, copy validated fields (customer/operator/approver, consultant URLs), set project owner metadata.
- **Dependencies:** Requires the association IDs captured in `generated/project-configuration-context.md` to remain accurate (197/205/207/209).

## 2. Data Contracts

| Object | Properties | Source |
| --- | --- | --- |
| Deal | `assign_consultant_to_a_new_sales_deal`, `link_for_consultant`, `hj_customer_id`, `hj_operator_id`, `missing_important_info`, `deal_error_note_id` | WF-01, WF-03 |
| Company | `hj_taxable`, `hj_terms` | Pulled into the deal during WF-03 validation |
| HJ Projects | `hj_project_name`, `hj_approver_email`, `hj_approver_is`, `hj_customer`, `hj_operator` | Project creation workflow |

Ensure the context extractor output matches these expectations before and after changes.

## 3. Implementation Checklist
1. **Refresh exports:** `node scripts/hubspot/node/context/generate-system-context.js --export=workflows --ids=567275018,567293814`.
2. **Run context extractor:** `python3 analysis/timesheet_process/shared/extract_project_configuration_context.py`.
3. **Simulate recruiting-to-sales handoff:** Push a recruiting deal through WF-01, then move the corresponding sales deal into Quote Review.
4. **Validate outputs:**
   - Deal retains Quote Review/Closed Won with `missing_important_info = No`.
   - `hj_projects` record created with cust/operator/approver properties populated.
5. **Log results:** Update `analysis/timesheet_process/shared/foundations-build-notes.md` and create a run entry in `logs/documentation-run-*.json`.

## 4. Troubleshooting
- **Deal stuck outside Closed Won:** Use the `deal_error_note_id` reference to identify missing associations; resolve in CRM and re-run WF-03.
- **Project object missing fields:** Confirm WF-03 populated the deal properties before project creation fired; re-enroll the deal if necessary.
- **Consultant URLs blank:** Re-run WF-01 on the recruiting deal to regenerate URLs; ensure the consultant contact still meets enrollment conditions.
- **Well creation link broken:** Validate that `create_associate_well` property points to a live CMS route and that well forms exist.

## 5. Future Enhancements
- Add telemetry (custom object or dashboard) to track frequency of `missing_important_info` causes.
- Automate notification to operations when WF-03 fails more than once for the same deal.
- Introduce a regression test harness that replays WF-01/03 against sandbox deals after any workflow update.

_Last updated: 2025-09-18._

