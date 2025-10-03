# Foundations Data Architecture Overview

This document captures the data model underlying Phase 01 (Foundations). It inventories the primary HubSpot objects, key properties, associations, and flow of data between workflows, CMS assets, and custom objects.

> **Toolbox Link**: Treat this inventory as the canonical reference for the shared schema registry described in [docs/standards/toolbox.md](../../../../docs/standards/toolbox.md). Any property or association change must be reflected in the MariaDB mirror and upcoming Frappe DocTypes.

## 1. Core Objects & Properties

### Deal (0-3 – Sales Pipeline)
| Property | Source | Purpose |
| --- | --- | --- |
| `hj_customer_id`, `hj_customer` | WF-03 | Customer company reference used for project/billing |
| `hj_operator_id`, `hj_operator` | WF-03 | Operator company reference |
| `assign_consultant_to_a_new_sales_deal` | WF-01 | Consultant intake URL (HTML button) |
| `link_for_consultant` | WF-01 | Encrypted timesheet portal token |
| `scope_of_work_and_pricing` | WF-01 | Scope creation URL/button |
| `create_associate_well` | WF-03 | Well creation link for CMS |
| `missing_important_info` | WF-03 | Validation flag preventing Closed Won |
| `deal_error_note_id` | WF-03 | Note reference with remediation details |

### Recruiting Deal (Pipeline 8926629)
| Property | Source | Purpose |
| --- | --- | --- |
| `consultant_first_name`, `consultant_last_name`, `consultant_full_name` | WF-01 | Consultant metadata captured from contact |
| `consultant_email`, `consultant_unique_id` | WF-01 | Keys used by timesheet + scope flows |
| `which_discipline_`, `possible_roles`, `test`, `test_link`, `title_job` | WF-01 | Role/pricing configuration for consultant onboarding |

### Company (0-2)
| Property | Source | Purpose |
| --- | --- | --- |
| `msa_terms` (`hj_terms`) | WF-03 | Billing terms copied onto project |
| `hj_taxable` | WF-03 | Tax flag for project/billing |

### Contact (0-1)
| Property | Source | Purpose |
| --- | --- | --- |
| `sof_consultant_id`, `sof_consultant_name`, `sof_project_id` | CMS scope forms | Identifiers for scope approval workflow |
| `sof_approval_unique_id`, `sof_sales_deal_id` | Scope forms | Keys linking approval to deal/project |
| `sof_consultant_*_prices`, `sof_hj_*_prices` | Scope forms | Pricing arrays (comma-separated) |
| `sof_comment_note`, `sof_marketing_email_view_response_button` | WF-09 | Approval note + link for approver |
| `sales_deal_id_to_be_assigned`, `unique_project_id_from_sales_deal` | Consultant assignment form | Hidden fields used by WF-06 |
| `submitted_as_timesheet_contact` | WF-09 | Tracks whether contact triggered approval |

### HJ Projects (Custom Object `2-26103074`)
| Property | Source | Purpose |
| --- | --- | --- |
| `hj_project_name`, `hj_project_id` | Project creation workflow | Project display + ID |
| `hj_approver_email`, `hj_approver_name`, `hj_approver_is` | WF-03 | Approver metadata used by approvals |
| `hj_sales_deal_owner_name`, `hj_sales_deal_owner_email` | WF-03 | Owner metadata for escalations |

### HJ Consultants / HJ Services (Custom Object `2-26103040`)
| Property | Source | Purpose |
| --- | --- | --- |
| `hj_approved` | WF-09 | Approval status per pricing line |
| `hourly_role_price`, `daily_role_price`, `fee_one_time_price`, `per_each_price`, `per_mile_price` | WF-09 | Approved consultant pricing |
| `hj_hj_*` counterparts | WF-09 | H&J baseline pricing |
| `scope_of_work_approval_comment` | WF-09 | Approver comment stored for audit |

### HJ Wells (Custom Object `2-26102958`)
| Property | Source | Purpose |
| --- | --- | --- |
| `hj_well_operator_id`, `hj_well_deal_id` | Create Well form, WF-04 | Keys enabling association creation |
| `name` | CMS form | Display in approvals/billing |

## 2. Associations & Relationship Labels
| Association | Type ID | Source Workflow | Usage |
| --- | --- | --- | --- |
| Deal ↔ Consultant | 4 | WF-06 | Consultant assignment to deal |
| Deal ↔ Customer company | Label "Customer" | WF-03 | Required before Closed Won |
| Deal ↔ Operator company | Label "Operator" | WF-03 | Required before Closed Won |
| Deal ↔ Approver contact | Label "Approver" | WF-03 | Approval routing |
| Deal ↔ Primary contact | Label "Primary Contact" | WF-03 | Validation |
| Deal ↔ HJ Project | 197/198 | Project creation | Connects sales deal and project |
| HJ Project ↔ Company | 205/206 (Operator), 207/208 (Customer) | Project creation | Downstream billing/reporting |
| HJ Project ↔ Consultant | 209/210 | Project creation | Timesheet routing |
| Deal ↔ HJ Well | 128 | WF-04/WF-05 | Billing + scope context |
| Company ↔ HJ Well | 126 | WF-04 | Operator linkage |

## 3. Data Flow Summary
1. **Consultant onboarding (WF-01):** Reads recruiting deal + associated consultant contact; writes consultant metadata, assignment URL, scope URL onto deal.
2. **Scope authoring (CMS forms):** Consultant submits pricing; data stored on contact properties (`sof_*`) and used to populate custom object IDs.
3. **Approval (WF-09):** On approval form submission, workflow reads `sof_*` arrays, updates HJ Consultant records, and writes structured deal notes/links.
4. **Deal validation (WF-03):** Ensures associations and properties are present; copies company/customer/operator/approver data to deal/project.
5. **Well association (WF-04/05):** Creates or links wells to company/deal using IDs collected earlier.
6. **Project creation:** When WF-03 succeeds, project object is created with all validated data, establishing associations for downstream phases.

## 4. Storage Patterns & Concerns
| Pattern | Location | Benefits | Risks |
| --- | --- | --- | --- |
| HTML buttons for URLs | Deal properties (`assign_consultant_to_a_new_sales_deal`, `scope_of_work_and_pricing`, `create_associate_well`) | Easily surfaced in CRM UI | Hard-coded HTML; inconsistent styles; security review required |
| Comma-separated arrays | Contact scope properties (`sof_*`) | Avoids additional custom objects | Manual parsing in workflows; prone to malformed data |
| Dual-source pricing | HJ Consultant object (`hj_*` vs `hj_hj_*`) | Captures consultant vs baseline pricing | Hard to audit alignment; no versioning |
| Association labels | Customer/Operator/Approver in WF-03/WF-04 | Clear semantics | Manual governance needed; changes ripple across workflows |

## 5. Outstanding Questions / Follow-ups
- Should scope data move to a dedicated custom object per submission (removing comma-separated arrays)?
- Would a serverless service/shared module centralize URL generation (consultant, scope, well) to avoid HTML buttons?
- How should we version schema exports and keep association IDs synchronized across workflows and documentation?
- What governance model ensures label names (Customer, Operator, Approver) stay consistent across teams?

Document updates here whenever schemas change or new data flows are introduced in Foundations.

## 6. Recommended Improvements

| Theme | Recommended Action | Target Outcome |
| --- | --- | --- |
| URL generation | Build a shared service (serverless function or CRM extension) that returns signed URLs for consultant portal, scope creation, and well creation; workflows store only tokens | Removes HTML buttons from deal properties; single source for URL logic |
| Scope storage | Replace comma-separated `sof_*` arrays with a dedicated custom object (scope submission) linked to contact + project | Structured data model, easier auditing and approvals |
| Pricing synchronization | Introduce versioned records or history table for HJ Consultant pricing updates | Traceability of approval changes and rollback capability |
| Workflow custom code | Extract shared utilities (association lookups, note builders) into reusable scripts / serverless endpoint | Reduce duplication across WF-01, WF-03, WF-09, WF-04/05 |
| Property governance | Define a schema registry (document + validation script) for required properties and association labels | Prevent accidental renames or deletions; supports automated linting |
| CMS modules | Refactor scope/approval modules to consume API responses instead of building arrays in JS; centralize validation | Consistent front-end behaviour and easier maintenance |
| Schema exports | Automate `extract_project_configuration_context.py` + workflow/schema exports as part of CI, storing snapshots | Ensures documentation stays aligned with HubSpot configuration |
| Toolbox sync | Record schema changes in the MariaDB registry and verify LanceDB/Frappe ingest uses the same metadata | Keeps HubSpot, Frappe, and AI services in lockstep |

### AI Agent Guidance
- When generating or modifying code, prefer calling shared services (once implemented) instead of embedding HTML/URLs directly in properties.
- Flag any new comma-separated arrays or HTML buttons as tech debt; suggest structured alternatives.
- Before altering workflows that manipulate `scope_of_work_and_pricing` or `sof_*` properties, consult this document to maintain data integrity.
