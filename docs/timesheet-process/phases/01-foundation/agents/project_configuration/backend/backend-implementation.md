# Project Configuration Backend Implementation (Foundations)

This guide documents the backend automation that prepares deals for project creation during the Foundations phase. It focuses on the workflows and data contracts that must pass **before** the approval or billing phases ever run.

## Scope
- Maintain the deal-stage automation that validates associations and writes project-ready fields.
- Ensure consultant readiness metadata is generated from the Recruiting pipeline.
- Confirm the project object creation trigger fires only after all prerequisites succeed.

## Source Workflows
| ID | Name | Purpose |
|---|---|---|
| 567275018 | 01. Update Recruiting Deal | Populate consultant metadata/URLs on recruiting deals once they reach qualified stages. |
| 567293814 | 03. Update Sales Deal & Create Custom Project Object | Validate customer/operator/approver/primary contact associations and push the "Create Project" trigger when the sales deal hits Quote Review or Closed Won. |
| (see workflow folder) | Project Creation Flow | Creates the `hj_projects` object using the validated deal data (runs only after WF-03 succeeds). |

_Workflow JSON lives in `data/raw/workflows/`. Match IDs to the comprehensive map (`analysis/process-analysis/comprehensive-process-map.md`)._

## Deal Property Contracts (WF-01 & WF-03)
| Property | Owner Workflow | Notes |
|---|---|---|
| `consultant_full_name`, `consultant_email`, `consultant_unique_id` | WF-01 | Derived from the recruiting deal’s associated consultant contact. |
| `assign_consultant_to_a_new_sales_deal` | WF-01 | HTML button linking to the consultant assignment flow. |
| `link_for_consultant` | WF-01 | Encrypted timesheet URL used by the consultant portal. |
| `hj_customer_id`, `hj_customer_name` | WF-03 | Pulled from the associated Customer company (label **Customer**). |
| `hj_operator_id`, `hj_operator_name` | WF-03 | Pulled from associated Operator company (label **Operator**). |
| `owner_name`, `owner_email`, `owner_contact_id` | WF-03 | Deal owner metadata injected into the project object. |
| `create_associate_well` | WF-03 | HTML link used to seed the well creation UI. |
| `missing_important_info`, `deal_error_note_id` | WF-03 | Set when validations fail; should remain empty when the deal is ready to stay Closed Won. |

Refer to the generated schema extract (`generated/project-configuration-context.md`) for the full `hj_projects` property list the project creation workflow consumes.

## Association Gating Rules (WF-03)
WF-03 blocks the deal (moves back to stage 31327604) unless the following are true:
1. Customer company associated with label **Customer**
2. Operator company associated with label **Operator**
3. Primary contact associated
4. Approver contact associated (must not also be the consultant)
5. Deal owner assigned
6. Customer company has MSA terms populated

The project creation workflow only fires when WF-03 completes without setting `missing_important_info`.

## Consultant Readiness (WF-01)
- Runs in the Recruiting pipeline (`pipeline=8926629`).
- Generates the consultant metadata and assignment/timesheet URLs required later in the flow.
- If consultants are not in the expected stages, the sales-side project creation should be considered blocked.

## UI & Forms (Foundations)
Key modules/forms referenced by these workflows:
| Asset | Location | Purpose |
|---|---|---|
| `hjp-assign-consultant-to-new-deal-01/02/03.module` | `data/raw/themes/Timesheets-Theme/modules/` | Interfaces used when assignment URLs are clicked. |
| Consultant assignment form (`f1784acd-d74d-441e-b5e5-c0c4fbbf2f5e`) | `data/raw/ai-context/ai-context-export/context-files/` | Triggers WF-06 to associate consultants to deals. |
| `create-associate-well` page | CMS route referenced by `create_associate_well` property | Allows well creation prior to project creation. |

Ensure these assets remain in sync with the deal properties and URLs produced by WF-01/WF-03.

## Operational Checklist
1. **Validate exports** – `python3 analysis/timesheet_process/shared/extract_project_configuration_context.py` to refresh property/association/module tables.
2. **Review WF-01** – Confirm consultant metadata is written for the latest recruiting stages.
3. **Review WF-03** – Use HubSpot history to ensure the validation gate is catching missing associations and that successful runs populate all fields above.
4. **Test project trigger** – Push a deal through Quote Review → Closed Won; verify the project object is created and populated via the downstream workflow.
5. **Log outcome** – Record results in `logs/documentation-run-*.json` and refresh dashboards.

## Troubleshooting
- **Deal stuck in Quote Review:** Inspect WF-03 error note; most often a missing approver/customer label or MSA term.
- **Consultant URLs missing:** Re-run WF-01 on the recruiting deal; confirm consultant contact has required properties.
- **Project object missing fields:** Compare against `generated/project-configuration-context.md` and confirm WF-03 outputs populated before project creation executed.

_Last reviewed: context index 2025-09-18._

