# Foundations End-to-End Trace

Holistic view of Phase 01, covering automation, artefacts, and validation steps from project intake through workflow handoff.

> Generated via scripts/agent-core/generate-phase-docs.js using shared/source/phases.json

## 1. Phase Overview

- **Process summary:** `analysis/timesheet_process/phases/01-foundation/docs/overview.md`
- **Status ledger:** `analysis/timesheet_process/phases/01-foundation/docs/STATUS.md`
- **Readiness report:** `analysis/timesheet_process/phases/01-foundation/docs/foundation-phase-status.md`

Order of operations: project configuration -> scope management -> approver assignment -> company associations -> data relationships -> workflow configuration handoff.

## 2. Project Configuration (WF-01, WF-03, Project Creation)

**Purpose:** Validate sales deals, generate consultant handoff artefacts, and create hj_projects records.

| Step | Workflow / Asset | Trigger | Actions | Result |
| --- | --- | --- | --- | --- |
| 1 | WF-01 Update Recruiting Deal (567275018) | Recruiting deal enters qualified stage | Copy consultant details, generate assignment + portal URLs | Recruiting deal mirrors consultant context |
| 2 | WF-03 Update Sales Deal & Create Custom Project Object (567293814) | Sales deal enters Quote Review or Closed Won | Validate customer/operator/approver/primary/owner, write project-ready properties, set missing_important_info/deal_error_note_id | Deal cleared (or blocked) for project creation |
| 3 | Project Creation Workflow | WF-03 completes without errors | Create hj_projects, copy validated properties, set associations | Project record instantiated |

| Object | Property | Purpose |
| --- | --- | --- |
| Deal | `hj_customer_id` | Customer company ID saved during WF-03 |
| Deal | `hj_operator_id` | Operator company ID saved during WF-03 |
| Deal | `assign_consultant_to_a_new_sales_deal` | Consultant assignment URL from WF-01 |
| Deal | `link_for_consultant` | Consultant portal token from WF-01 |
| Deal | `create_associate_well` | Well creation CMS link from WF-03 |
| Deal | `scope_of_work_and_pricing` | Scope creation button generated during WF-01 |
| Deal | `missing_important_info` | WF-03 validation flag |
| Deal | `deal_error_note_id` | Note ID describing validation failure |
| Company | `hj_terms` | Customer billing terms reused downstream |
| Company | `hj_taxable` | Tax flag reused downstream |
| HJ Projects | `hj_project_name` | Project display name |
| HJ Projects | `hj_approver_email` | Approver email stored on project |
| HJ Projects | `hj_customer` | Customer name copied from company |
| HJ Projects | `hj_operator` | Operator name copied from company |
| HJ Projects | `hj_sales_deal_owner_name` | Deal owner name retained |
| HJ Projects | `hj_project_id` | Unique project identifier created during workflow |

| Property / Label | URL Pattern | Source |
| --- | --- | --- |
| `assign_consultant_to_a_new_sales_deal` | https://app.hubspot.com/l/consultant-assignment?dealId={deal_id}&consultantId={consultant_vid} | WF-01 |
| `link_for_consultant` | https://portal.hjpetroleum.com/timesheets/{token} | WF-01 |
| `scope_of_work_and_pricing` | https://hjpetro-1230608.hs-sites.com/prepare-consultants-start?consultant_deal_id={deal_id}&consultant_unique_id={consultant_id}&consultant_name={encoded_name}&consultant_email={email} | WF-01 |
| `create_associate_well` | https://portal.hjpetroleum.com/wells/new?dealId={deal_id} | WF-03 |

## 3. Scope Management (Scope Creation & Approval)

**Purpose:** Generate consultant scope packages and capture approval decisions before project activation.

| Step | Workflow / Asset | Trigger | Actions | Result |
| --- | --- | --- | --- | --- |
| 1 | WF-01 Update Recruiting Deal (Action 3) (567275018) | Recruiting deal enters qualified stage | Writes the scope creation button with deal and consultant parameters | Consultant receives scope launch link |
| 2 | Consultant scope authoring flow (CMS) | Consultant follows scope URL | Captures pricing arrays and notes on contact/custom object properties prefixed with sof_ | Scope request staged for approval |
| 3 | WF-09 Scope of Work - Approval (567402589) | Scope approval form submitted | Updates consultant records with pricing + status, creates deal note, patches approver contact with view button | Approval decision stored and shared |

| Object | Property | Purpose |
| --- | --- | --- |
| Deal | `scope_of_work_and_pricing` | Scope creation button displayed on recruiting deal |
| Contact | `sof_consultant_id` | Consultant unique ID referenced during approval |
| Contact | `sof_project_id` | Project identifier linked to scope |
| Contact | `sof_approval_unique_id` | Approval tracking ID stored for WF-09 |

### Notes

- Scope authoring uses the prepare-consultants CMS modules located in data/raw/hubspot-cms-assets/
- WF-09 requires approver contact to be labeled Approver and distinct from consultant and primary contact
- missing_important_info must return to 'No' before project activation

## 4. Company Associations (WF-04, WF-05)

**Purpose:** Ensure wells are linked to operators and sales deals prior to approvals and billing.

| Step | Workflow / Asset | Trigger | Actions | Result |
| --- | --- | --- | --- | --- |
| 1 | WF-04 Associate Created Well to Sales Deal (567358311) | Create Well form submission (b682c714-e395-4677-bbfb-1a32fad5f04b) creates HJ Well | Use hj_well_operator_id/hj_well_deal_id to create associations (types 126/128) | New well linked to operator and deal |
| 2 | WF-05 Associate Existing Wells to Sales Deal (567358566) | Associate Existing Wells form submission (3876c3f0-6363-4958-a3be-500a64bd6431) | Loop through associate_existing_wells_ids_array to associate wells to deal | Existing wells linked to deal |

| Object | Property | Purpose |
| --- | --- | --- |
| HJ Wells | `hj_well_operator_id` | Operator ID required for WF-04 |
| HJ Wells | `hj_well_deal_id` | Deal ID required for WF-04 |
| Deal | `associate_existing_wells_sales_deal_id` | Deal target for WF-05 |
| Contact | `associate_existing_wells_ids_array` | Well IDs selected on form |

### Notes

- Workflow URL create_associate_well must match the CMS route for well creation
- tools/validate_wf04_wf05.py validates association coverage

## 5. Data Relationships (Association Registry)

**Purpose:** Maintain the shared association and schema catalogue used across Foundations workflows.

| Association Type | Relationship |
| --- | --- |
| 4 | Deal -> Consultant |
| 126 | Company -> HJ Well |
| 128 | Deal -> HJ Well |
| 197 | Deal -> HJ Project (primary) |
| 205 | Project -> Operator company |
| 207 | Project -> Customer company |
| 209 | Project -> Consultant contact |

### Notes

- Schema exports live in data/raw/ai-context/ai-context-export/data-model/
- workflow references summarised in agents/data_relationships/workflows/workflow-sequence.md

## 6. Workflow Configuration Handoff (Approval Readiness)

**Purpose:** Record disabled approval workflows and readiness requirements prior to Phase 03 activation.

### Notes

- Workflows tracked: 1680618036 and 1682422902 - see agents/workflow_configuration/assets/asset-inventory.json
- Readiness properties documented in agents/workflow_configuration/properties/property-mapping.json
- Activation steps outlined in agents/workflow_configuration/workflows/workflow-sequence.md

