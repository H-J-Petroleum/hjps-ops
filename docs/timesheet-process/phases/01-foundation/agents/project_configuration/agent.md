# Project Configuration Agent Guide

This guide equips the project_configuration agent to maintain the foundational HubSpot assets that drive project setup for the H&J Petroleum timesheet system.

## Mission & Scope
- Establish and maintain the objects, workflows, and associations required for new project onboarding.
- Guarantee every new project record links to consultants, companies, approvals, and downstream processes.
- Act as the operational owner for regression analysis whenever project-related assets drift from the target blueprint.

## Workflow Responsibilities
- **WF-01 (567275018 – Update Recruiting Deal):** Maintain consultant metadata and encrypted assignment/timesheet URLs on recruiting deals.
- **WF-03 (567293814 – Update Sales Deal & Create Custom Project Object):** Enforce customer/operator/primary/approver/owner/MSA prerequisites before a deal remains Closed Won so project creation can proceed.
- Downstream project creation workflows rely on these validations; investigate WF-03 history first when project objects fail to appear.

## Operating Context
- **Phase:** 01_foundation
- **Subprocess:** project_configuration
- **Primary references:**
  - `analysis/timesheet_process/PROCESS-FLOW-COMPLETE.md` (end-to-end flow)
  - `analysis/timesheet_process/phases/01-foundation/project_configuration/overview.md` (subprocess narrative)
  - `analysis/timesheet_process/phases/01-foundation/project_configuration/backend/backend-implementation.md` (workflow details)
  - `analysis/timesheet_process/phases/01-foundation/project_configuration/frontend/frontend-specification.md` (interface expectations)
  - `analysis/timesheet_process/phases/01-foundation/project_configuration/properties/property-mapping.json` (object/property map)

## Inputs & Outputs
- **Inputs:**
  - Project intake data (internal project tracker, HubSpot deal handoff)
  - HubSpot object schemas (`data/raw/ai-context/ai-context-export/data-model/hj_projects-schema-*.json`, plus contacts/companies/deals)
  - Workflow definitions exported to `data/raw/workflows/`
- **Outputs:**
  - `hj_projects` records populated with mandatory metadata for approvals and billing
  - Associations linking projects to companies, consultants, and deals (association IDs listed below)
  - Updated documentation run log + dashboard timestamp

### Core Project Properties
| Property | Purpose | Required |
|---|---|---|
| `hj_project_name` | Primary project display name shown across timesheets and approvals | ✅ |
| `hj_approver_email` / `hj_approver_is` / `hj_approver_name` | Route approvals to the correct internal/external contact later in the process |  |
| `hj_primary_contact_id` / `hj_primary_contact_email` | Identify project coordinator for notifications |  |
| `hj_customer` / `hj_customer_id` | Tie project to customer record for billing |  |
| `hj_operator` / `hj_operator_id` | Capture operating company when different from customer |  |
| `hj_sales_deal_owner_*` | Preserve opportunity owner metadata for escalation |  |
| `hj_taxable`, `hj_terms` | Feed invoicing logic |  |
_Full property inventory: `analysis/timesheet_process/phases/01-foundation/project_configuration/generated/project-configuration-context.md`_

### Critical Associations
| Association | Target | ID |
|---|---|---|
| `primary_project_deal` | deals | 197 |
| `project_customer` | companies ↔ hj_projects | 207 / 208 |
| `project_consultant` | contacts ↔ hj_projects | 209 / 210 |
| `project_operator` | companies ↔ hj_projects | 205 / 206 |

_WF-03 validation requires these associations (plus primary and approver contacts) before a deal may remain Closed Won._

## Success Criteria
- Project creation playbook replicable without manual intervention.
- All mandatory project properties populated and synced with dependent objects.
- WF-03 completes without `missing_important_info` flipping to "Yes" (deal holds Closed Won and triggers project creation).
- Change log updated with context-index timestamp and agent actions.

## Key Workflows & Automation
- **WF-01 – Update Recruiting Deal** (`data/raw/workflows/workflow-01-567275018-v4.json` if exported)
  - Populates consultant metadata on recruiting deals and generates assignment/timesheet URLs referenced by the CMS modules.
- **WF-03 – Update Sales Deal & Create Custom Project Object** (`data/raw/workflows/workflow-03-567293814-v4.json`)
  - Validates associations (customer, operator, primary, approver, owner) and MSA terms before allowing the deal to remain Closed Won.
  - Writes customer/operator/owner properties and the `create_associate_well` URL consumed by the project creation workflow.
- **Project creation workflow (Workflow Configuration folder)**
  - Creates the `hj_projects` record after WF-03 passes. Investigate this only after WF-03 validations succeed.

### Supporting UI Assets
- Consultant handoff flows rely on the URLs emitted by WF-01; ensure these modules remain consistent with the workflow output.

| Module | Label | Fields | Sample handles |
|---|---|---|---|
| `hjp-assign-consultant-to-new-deal-01.module` | HJP - Assign a Consultant to a New Sales Deal - 01 | 0 | — |
| `hjp-assign-consultant-to-new-deal-02.module` | HJP - Assign a Consultant to a New Sales Deal - 02 | 0 | — |
| `hjp-assign-consultant-to-new-deal-03.module` | HJP - Assign a Consultant to a New Sales Deal - 03 | 0 | — |
| `hjp-prepare-consultants-start.module` | HJP - Prepare Consultants - Start | 0 | — |
| `hjp-prepare-consultants-02.module` | HJP - Prepare Consultants - 02 | 0 | — |
| `hjp-prepare-consultants-overview.module` | HJP - Prepare Consultants - Overview | 0 | — |
| `hjp-prepare-consultants-maxtrix.module` | HJP - Prepare Consultants - Matrix | 0 | — |
| `hjp-prepare-consultants-03-overview.module` | HJP - Prepare Consultants 03 - Overview | 0 | — |

_Fields column uses `fields.json`; many modules are container layouts without explicit field definitions._

## Runbook
1. **Survey context**
   - Execute `python3 analysis/timesheet_process/shared/context_index.py --pretty`.
   - Run `python3 analysis/timesheet_process/shared/extract_project_configuration_context.py` to refresh the generated property/workflow snapshot.
   - Confirm latest counts in `logs/agent-dashboard.html` summary banner.
2. **Review inputs**
   - Check project configuration schema & property mapping for new requirements.
   - Load relevant workflow JSON to verify triggers/actions after changes.
3. **Implement updates**
   - Apply schema/property adjustments via HubSpot (custom object settings or APIs).
   - Update workflow logic inside HubSpot (or scripts) and export refreshed definitions (`node scripts/hubspot/node/context/generate-system-context.js --export=workflows`).
4. **Validate**
   - Create a test project and walk it through consultant assignment through approval submission.
   - Confirm associations (IDs 197/205/207/209) are present and approval request workflow fires.
5. **Document & log**
   - Regenerate prompt packs if textual documentation changed.
   - Record the run in `logs/documentation-run-*.json` and refresh dashboards.

## Troubleshooting
- **Workflow not firing:** Verify object type targets, ensure private app token in `Get-Secret HS_PROD_PRIVATE_APP` is current, and confirm the record meets LIST_BRANCH criteria in the exported JSON.
- **Missing associations:** Inspect association IDs in `data/raw/ai-context/ai-context-export/data-model/hj_projects_schema.json`; update relationship rules in HubSpot if IDs changed.
- **Property drift:** Compare project records to `property-mapping.json` baseline; align naming and data types.
- **API quota warnings:** Stagger bulk updates and use the comprehensive Node exporter for full refreshes.
- **Deal stuck outside Closed Won:** Review WF-03 run history and `deal_error_note_id` to see which prerequisite failed; coordinate with approver/company subprocess owners before retrying.

## Validation Checklist
- Mandatory project properties set (name, status, approver email/IS, billing flags).
- `hj_projects` linked to primary company, consultant contact, and active approvals.
- Approval workflows triggered for both internal and customer paths.
- Context index regenerated; dashboard summary updated; QA checklist completed (`analysis/timesheet_process/shared/ai-run-qa-checklist.md`).

## Escalation & Handoffs
- Coordinate schema-level changes with the backend agent (01_foundation `backend/` docs).
- Notify approval phase owners if workflow IDs or payloads change.
- Hand off UI updates to the frontend agent when module/form adjustments are required.
- Log unresolved blockers in `analysis/timesheet_process/phases/01-foundation/project_configuration/issues/known-issues.md`.

---
Last regenerated: 2025-09-18T21:56 (context index timestamp).


