# Schema Registry Notes (Toolbox Alignment)

This file captures the object/property/association expectations that the API tooling must honour. Copy these entries into the MariaDB schema registry before deployment so HubSpot, Frappe, and agent services stay in sync.

## Core Objects
| Object | HubSpot Type ID | Required For | Reference |
| --- | --- | --- | --- |
| Recruiting Deal | `0-3` (Pipeline `8926629`) | WF-01 consultant metadata; portal token generation | analysis/timesheet_process/phases/01-foundation/docs/DATA-ARCHITECTURE.md |
| Sales Deal | `0-3` (Default pipeline) | WF-03 validation; project + well provisioning | analysis/process-analysis/comprehensive-process-map.md |
| HJ Projects | `2-26103074` | Project context/lock state | analysis/timesheet_process/phases/01-foundation/docs/DATA-ARCHITECTURE.md |
| HJ Consultants | `2-26103040` | Rate cards, authorised wells | analysis/timesheet_process/phases/02-timesheet-creation/docs/DATA-ARCHITECTURE.md |
| HJ Wells | `2-26102958` | Well associations & operator linkage | analysis/process-analysis/comprehensive-process-map.md |
| HJ Timesheets | `2-26173281` | Timesheet line items created by WF-11 | analysis/timesheet_process/phases/02-timesheet-creation/docs/DATA-ARCHITECTURE.md |

## Key Properties We Must Preserve
| Object | Property | Purpose |
| --- | --- | --- |
| Recruiting Deal | `consultant_unique_id`, `link_for_consultant`, `assign_consultant_to_a_new_sales_deal`, `title_job`, `test`, `test_link` | Seed consultant portal + assignment flows |
| Sales Deal | `hj_customer_id`, `hj_customer_name`, `hj_operator_id`, `hj_operator_name`, `owner_email`, `create_associate_well`, `missing_important_info`, `hj_project_id` | Ensure WF-03/WF-04 pass and project data is consistent |
| Contact | `hj_notify_project_id`, `hj_notify_project_object_id`, `cg_*` arrays, `quote_*`, `submitted_as_timesheet_contact`, `main_contact_id`, `approval_timesheet_ids_array`, `response_approval_timesheet_ids_array` | Provide WF-11 staging context and approval handoff |
| HJ Consultants | `consultant_deal_id`, `payment_deal_id`, `hj_project_id`, `well`, `hourly_role_price`, `daily_role_price`, `per_mile_price`, `per_each_price`, `fee_one_time_price`, `hj_hj_*` mirrors | Calculate totals and validate well permissions |
| HJ Projects | `hj_project_is_locked`, `hj_approver_email`, `hj_sales_deal_owner_email` | Block submissions when locked and keep notifications aligned |
| HJ Timesheets | `timesheet_project_id`, `timesheet_consultant_id`, `timesheet_well`, `timesheet_role`, `timesheet_job_service`, `timesheet_billing_frequency`, `timesheet_price`, `timesheet_total_price`, `timesheet_approval_status`, `timesheet_trigger_status`, `timesheet_unique_id`, `bill_account`, `terms__number_format_` | Maintain compatibility with approvals, billing, and deletions |

## Association Type Map
| Relationship | Association Type ID | Notes |
| --- | --- | --- |
| Deal ↔ Consultant (assignment) | `4` | Established by consultant assignment workflow |
| Deal ↔ Well | `128` (`USER_DEFINED`) | Created by WF-04/WF-05; must include all billing wells |
| Company ↔ Well | `126` (`USER_DEFINED`) | Operator linkage used during well creation |
| Deal ↔ HJ Project | `197/198` | Sales deal ↔ project associations |
| Contact ↔ HJ Project | `210` | Grants portal access in Step 0 |
| Contact ↔ HJ Timesheet | `280` | Tracks creator/delegate relationships |

## Staging Arrays & Tokens
- `cg_*` arrays on the contact must remain comma-separated with consistent ordering: project IDs, wells, units, quantities, start/end dates/times, ordinal numbers.
- `quote_consultant_id`, `quote_consultant_name`, `quote_customer_id` capture billing accounts for WF-11.
- Encrypted consultant IDs in portal URLs use the `contactId + 3522` rule (documented in WF-01). Any helper should isolate this logic so it can be swapped for the future shared signing service.

## Toolbox Compliance Notes
- No new HTML button properties should be introduced; any output for CRM/UI should be structured data that UI extensions can consume later.
- Record these schema entries (objects, properties, associations) in the MariaDB registry before deploying automation so the toolbox verification scripts can assert parity.
- Future helper code should reside alongside the shared helper library referenced in the toolbox so other services (Frappe, agents) can reuse it with minimal changes.
