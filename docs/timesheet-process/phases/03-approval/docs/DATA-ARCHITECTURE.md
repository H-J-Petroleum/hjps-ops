# Approval Data Architecture Overview

Phase 03 governs the HJ Approvals object, associated timesheet records, and the workflow metadata required to drive decision routing. This summary captures the core data relationships powering the approval lifecycle.

## 1. Core Objects & Properties

### HJ Approvals (Custom object 2-26103010)
| Property | Source | Purpose |
| --- | --- | --- |
| approval_project_id, approval_project_name | Portal submission ➜ WF-567500453 | Maintain project context for each approval package. |
| approval_timesheet_ids_array | WF-567500453 | Track the HJ Timesheet IDs bundled in the request. |
| approval_status, approval_outcome | WF-1680618036, WF-1682422902 | Represent customer vs. internal decision states (Pending, Approved, Rejected, Re-Submitted). |
| approval_processed_date, approval_response_notes, approval_rejection_reason | Decision workflows | Provide audit trail for billing and notifications. |
| approver_is, approver_email, approver_name | WF-567500453 | Route to the correct approver persona (HJ vs customer). |

### HJ Timesheets (Custom object 2-26173281)
| Property | Source | Purpose |
| --- | --- | --- |
| timesheet_project_id, timesheet_project_name | Phase 02 WF-11 | Link to the originating project for billing. |
| timesheet_consultant_id, timesheet_consultant_email | Phase 02 WF-11 | Keep consultant context for notifications and billing. |
| timesheet_approval_status | Phase 02 WF-11 (default) + Phase 03 workflows | Reflect lifecycle (Created, Submitted, Approved, Rejected). |
| response_approval_timesheet_ids_array | Decision workflows | Stamp approvals back onto the timesheet for downstream reporting. |
| timesheet_total_price, timesheet_quantity, timesheet_role | Phase 02 WF-11 | Feed billing calculations once approvals clear. |

### Contacts (0-1)
| Property | Source | Purpose |
| --- | --- | --- |
| approval_timesheet_ids_array | Portal module submission | Payload of line items selected for approval. |
| approval_request_id, approval_request_url | WF-567500453 | Provide follow-up actions and traceability. |
| submitted_as_timesheet_contact | Timesheet portal | Indicates when a delegate initiated the request. |
| hj_approver_email, hj_approver_is | Phase 01 configuration | Ensure the approval package routes to the correct stakeholder. |

## 2. Associations
- Contact ↔ HJ Approvals (0-210): request owner; used to derive notification targets.
- HJ Approvals ↔ HJ Timesheets (2-3): timesheet IDs saved in the approval payload create the association list used by billing.
- HJ Approvals ↔ Projects (0-2): ensures approvals inherit project metadata and escalation routing.

## 3. Validation & Guardrails
- Validate approver metadata (email, persona, escalation days) before triggering WF-567500453.
- Persist approval reminders and escalation history to preserve downstream SLA auditing.
- Store workflow run history and payload snapshots in verification logs for each cadence change.

For full schema samples and validation helpers, see [notes/BACKEND-IMPLEMENTATION-PLAN.md](notes/BACKEND-IMPLEMENTATION-PLAN.md) and [notes/TECHNICAL-SPECIFICATION.md](notes/TECHNICAL-SPECIFICATION.md).

**Related references:** [../../../docs/strategy/index.md](../../../docs/strategy/index.md), Phase 02 data architecture ([../02-timesheet-creation/docs/DATA-ARCHITECTURE.md](../02-timesheet-creation/docs/DATA-ARCHITECTURE.md)).