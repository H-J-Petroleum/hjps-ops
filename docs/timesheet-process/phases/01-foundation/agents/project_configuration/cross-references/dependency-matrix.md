# Cross-References – Project Configuration

## Upstream Dependencies
- **Recruiting Pipeline (WF-01):** Supplies consultant metadata (`consultant_full_name`, assignment URLs). If WF-01 fails, sales-side validation cannot proceed.
- **Company & Contact Associations:** CRM must maintain labels for Customer, Operator, Primary Contact, and Approver so WF-03 can evaluate prerequisites.

## Downstream Dependencies
- **Company Associations:** Validated deal properties (customer/operator IDs) drive the well-association workflows.
- **Approval Process (Phase 03):** Approver email/name copied onto `hj_projects` feeds approval routing and notification templates.
- **Billing Preparation:** Terms/tax flags pulled during WF-03 are consumed when invoices are generated in Phase 04.

## Integration Points
- **WF-03 ↔ Project Creation Workflow:** Project creation triggers only after WF-03 succeeds; monitor `missing_important_info` to ensure the handoff is clean.
- **CMS Modules (consultant assignment / well creation):** URLs embedded in deal properties must remain in sync with module routes; update both sides together.
- **Context Extract Scripts:** `extract_project_configuration_context.py` caches property/association data for agents. Rerun after workflow or schema updates.

_Last updated: 2025-09-18._
