# Foundations Improvement Plan

Comprehensive recommendations that consolidate findings from the data architecture, UI/UX, and implementation-method reviews.

## 1. Key Dependencies & Gaps
- **Consultant talent pipeline (Recruiting pipeline 8926629)** is central to WF-01. We need a dedicated walkthrough covering:
  - Stage definitions and required consultant properties.
  - How recruiting deals feed consultant readiness (`consultant_*`, `possible_roles`, pricing defaults).
  - Handoffs to timesheet, scope, and approval flows.
- **Shared services and libraries** are absent; URLs, buttons, and validation logic live in multiple workflows/modules.
- **Structured storage** for scope approvals is missing (comma-separated arrays, HTML buttons).
- **Toolbox compliance**: All workflow helper updates must live in the shared library defined in [docs/standards/toolbox.md](../../../../docs/standards/toolbox.md) so HubSpot, Frappe, and future services stay aligned.

## 2. Data Architecture Recommendations
| Action | Impact |
| --- | --- |
| Build a shared URL-generation service (serverless or CRM extension). | Eliminates HTML buttons in deal properties; ensures consistency across consultant, scope, and well links. |
| Introduce a dedicated scope submission custom object instead of `sof_*` arrays. | Normalizes approval data, simplifies workflows, and improves auditing. |
| Version schema exports automatically and document association labels. | Keeps documentation/live system aligned; prevents silent drift. |
| Establish a schema registry/governance checklist (customer/operator/approver labels, mandatory properties). | Protects workflows from accidental label/property changes. |
| Treat the MariaDB mirror as the canonical schema registry for HubSpot + Frappe migrations. | Aligns with toolbox standards and future service reuse. |

## 3. UI/UX Recommendations
| Action | Impact |
| --- | --- |
| Create shared CSS/JS assets (`hj-foundations-ui.css` / `hj-foundations-ui.js`) for buttons, tables, navigation. | Consistent styling and behaviour across consultant/scope modules. |
| Replace property-driven CTA buttons with CRM cards or UI extensions. | Responsive, accessible actions without embedding HTML in data fields. |
| Modularize large modules (`hjp-approve-scope-of-work-*`) and add validation helpers. | Easier maintenance, better user feedback, improved accessibility. |
| Define a UI testing checklist (contrast, keyboard navigation, responsive layout). | Ensures future changes meet baseline UX standards. |

## 4. Workflow & Automation Recommendations
| Action | Impact |
| --- | --- |
| Extract shared helper code for workflows (association lookups, note builders). | Reduce duplication in WF-01, WF-03, WF-09, WF-04/05. |
| Automate validation scripts (`validate_wf04_wf05.py`, future scope E2E test) in CI. | Prevent regressions in association/workflow exports. |
| Document and refactor consultant talent pipeline steps (lead → consultant → timesheet/scope). | Clarifies data flow and dependencies for agents and developers. |

## 5. Immediate Next Steps
- Capture notification prerequisites (emails, escalation configs) so Phase 03 workflows can send correct alerts.
1. Execute the Foundations verification plan (`FOUNDATIONS-VERIFICATION-PLAN.md`) via `analysis/timesheet_process/shared/verification/verify_phase.py --phase foundation` and resolve logged discrepancies.
2. Finish mapping the entire timesheet process (Phase 02) with documentation parity (overviews, assets, properties, workflows, issues).
3. Draft a detailed consultant talent pipeline guide (stages, required fields, workflow touchpoints) mirroring the Foundations trace format.
4. Prototype the shared URL-generation service and update WF-01/WF-03/Scope flows to consume it (publish to the helper library referenced by the toolbox).
5. Design shared CSS/JS utilities and refactor one pilot module (e.g., `prepare-consultants-02`) to use them (documented in the toolbox UI kit).
6. Outline the new scope submission custom object schema for future implementation, including MariaDB + Frappe DocType alignment.

Use this plan to prioritize roadmap items and brief AI agents on the standardized direction for Foundations.

