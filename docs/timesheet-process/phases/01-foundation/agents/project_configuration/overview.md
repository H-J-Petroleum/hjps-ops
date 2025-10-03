# Project Configuration – Foundations Phase Overview

This subprocess covers the deal-stage automation that validates required associations, builds the consultant handoff links, and ultimately creates the `hj_projects` record when a deal reaches **Quote/Review Resumes** or **Closed Won**.

## End-to-End Flow (Workflow 01 → 03)
1. **Workflow 01 – Update Recruiting Deal (ID 567275018)**
   - Runs on the recruiting pipeline; when a consultant hits the qualified stages, the workflow writes consultant metadata to the deal and generates the “Assign Consultant” and “Timesheet Portal” URLs.
   - Key fields populated (verified in JSON export): `consultant_full_name`, `consultant_email`, `link_for_consultant`, `assign_consultant_to_a_new_sales_deal`.
2. **Workflow 03 – Update Sales Deal & Create Custom Project Object (ID 567293814)**
   - Fires when an H&J sales deal enters Quote Review or Closed Won.
   - Validates associations **before** allowing the deal to progress:
     - Customer company (label: Customer)
     - Operator company (label: Operator)
     - Primary contact
     - Approver contact
     - Deal owner assigned
     - MSA terms present on the customer company
   - Blocks the stage (resets to 31327604) and writes `missing_important_info` / `deal_error_note_id` if any prerequisite fails.
   - When valid, populates customer/operator/deal-owner properties and issues the “Create/Associate Well” URL.
3. **Project Creation Workflow**
 - With the deal clean and associations in place, the downstream workflow (in Workflow Configuration folder) creates the `hj_projects` record and copies the validated data.

The CRM opportunity guide (`docs/assets/CreatingAnOpportunityinHubSpotForDrillingFluids-07b7a33a-3f62-4d20-8e07-d7610.pdf`) documents the salesperson steps that feed these workflows, ensuring the operational checklist matches the automation logic above.
For deeper workflow-by-workflow detail see `analysis/process-analysis/comprehensive-process-map.md` (Workflows 01, 03, …).

## Success Criteria
- All mandatory associations and consultant readiness checks pass **before** the deal stays in Closed Won.
- Workflow 03 completes without setting `missing_important_info`; the deal retains Closed Won.
- Generated URLs (consultant assignment, scope creation, well creation) are available on the deal record.
- Context extract (`generated/project-configuration-context.md`) confirms project schema and association IDs (197/205/207/209) are ready for the project object harvest.

## Handoffs
- Consultant assignment and scope creation rely on the URLs/associations produced here.
- `hj_projects` record creation and approval workflows (phases/03-approval) consume the populated metadata.
- See `backend/backend-implementation.md` for the properties and automation this subprocess must keep aligned.

---
Last aligned with workflows export: 2025-09-18 (context index + workflow JSON).
