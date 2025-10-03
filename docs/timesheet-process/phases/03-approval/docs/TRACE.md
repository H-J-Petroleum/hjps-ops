# Approval End-to-End Trace

End-to-end coverage of the timesheet approval pipeline across request intake, decision handling, and re-approval reminders.

> Generated via scripts/agent-core/generate-phase-docs.js using shared/source/phases.json

## 1. Phase Overview

- **Process summary:** `analysis/timesheet_process/phases/03-approval/docs/overview.md`
- **Status ledger:** `analysis/timesheet_process/phases/03-approval/docs/STATUS.md`
- **Dependencies:**
  - Consumes approval payload from Phase 02 (approval_timesheet_ids_array, submitted_as_timesheet_contact).
  - Requires Phase 01 project metadata (hj_approver_email, hj_approver_is, association 210 contact ↔ project).

Operational sequence: request intake → decision handling → reminders & re-approval → downstream notification/billing handoff.

## 2. Approval Request Intake

**Purpose:** Capture consultant-selected timesheets and create the HJ Approval record.

| Step | Workflow / Asset | Trigger | Actions | Result |
| --- | --- | --- | --- | --- |
| 1 | Consultant Approval Request (567500453) | Contact submits Request for Approval form (5dd64adc) | Validates selection, copies approval_* fields to contact, creates HJ Approvals record, queues notifications | HJ Approval created with pending status and approver metadata. |

### Inputs

- Form 5dd64adc-request-for-approval (target: Contact 0-1)
- Module 161468337269-timesheet-management-approval (exposes selection UI)
- Contact approval_timesheet_ids_array, approval_project_id, approver_* fields

### Outputs

- HJ Approvals record populated with project, consultant, and timesheet arrays
- Contact approval_status set to Submitted and approval_request_id stored

### Notes

- Contact remains the enrollment object; ensure approver properties exist before submission.
- Workflow writes approval links for both internal and customer approvers.

## 3. Internal & External Decision Handling

**Purpose:** Record approval outcomes and update related timesheets/projects.

| Step | Workflow / Asset | Trigger | Actions | Result |
| --- | --- | --- | --- | --- |
| 2 | Customer Approval Response (1680618036) | External approver submits approval response form (31f4d567) | Updates approval outcome, stamps decision metadata, emails consultant and HJ owner | Timesheet status moves to Approved/Rejected and customer notifications sent. |
| 3 | HJ Approval Response (1682422902) | Internal approver completes internal approval module (96919533807) | Persists decision details, handles delegation, updates approval outcome fields | Internal approvals logged with audit trail and escalation options. |

### Notes

- Decision routing driven by approver_is (HJPetro vs PrimaryContact).
- Both workflows patch HJ Approvals and related timesheet records with approval_outcome, approval_notes, approval_processed_date.

## 4. Reminders & Re-Approval Loop

**Purpose:** Nudge approvers and recycle rejected/expired approvals.

| Step | Workflow / Asset | Trigger | Actions | Result |
| --- | --- | --- | --- | --- |
| 4 | Reminder 1 (567466561) | Approval remains Pending after configured delay | Emails approver, flags contact for follow-up | Approver reminded to act on pending approvals. |
| 5 | Reminder 3 / Re-Approval (567463273) | Approval pending after additional delay or resubmitted by consultant | Escalates reminder cadence, flips approval_status to Re-Submitted when applicable | Resubmission path engaged with updated approval_request_id. |

### Notes

- Reminder cadence adjustable via workflow delays; ensure business hours logic matches SLA.
- Re-approval relies on consultants triggering a new request from the portal, reusing approval_timesheet_ids_array.

## 5. Data Synchronization & Notifications

**Purpose:** Synchronize approvals with related timesheets, projects, and notification workflows.

### Notes

- Timesheet records receive approval_outcome and response_approval_timesheet_ids_array for downstream billing.
- Reminder workflows feed shared notification policies; update shared/notifications when cadence changes.
- Approval outcomes trigger notification workflows (Phase 05) for consultant and internal stakeholders.
- Verified properties documented in docs/properties/contact-to-approval-mapping.md.
**Related references:** [IMPROVEMENT-PLAN.md](IMPROVEMENT-PLAN.md), [UI-UX-RECOMMENDATIONS.md](UI-UX-RECOMMENDATIONS.md), [../../../docs/strategy/index.md](../../../docs/strategy/index.md).
