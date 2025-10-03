# Agent Guidance – Timesheet Approval Process

Comprehensive guidance for managing the Phase 03 approval workflow.

## Quick Start (30 seconds)
- Primary assets: workflow 567500453 (Consultant Approval Request), workflows 1680618036 & 1682422902 (approval responses), reminder workflows 567466561 & 567463273.
- Forms: request-for-approval form `5dd64adc` (Contact target), external approval response form `31f4d567` (Contact target).
- Modules: `161468337269` (timesheet management approval UI), `96919533807` (internal approval interface), `96920867313` (external approval interface).
- Dependencies: HJ Projects must supply approver metadata (`hj_approver_email`, `hj_approver_is`, association 210 contact ↔ project). Timesheets arrive from Phase 02 with `approval_timesheet_ids_array` populated.
- Common issues: missing approver fields on the project record, delegation flags not set, response forms hitting the wrong object, reminders firing without SLA adjustments.

## Investigation Checklist (5 minutes)
**Before changes**
- Verify the contact record has the approval_* properties populated from the portal.
- Confirm the project association exists and approver fields are filled (email, name, unique ID, approver_is).
- Inspect the submitted form payload to ensure all URL parameters made it through the modules.
- Check that the HJ Approvals object was created and linked back to the contact/timesheets.
- Review phased verification logs for outstanding approval issues.

**When debugging**
- Review workflow 567500453 enrollment history for the contact and confirm it created the approval record.
- For decisions, compare run logs for workflows 1680618036 (external) and 1682422902 (internal) to ensure the correct branch fired.
- Check reminders 567466561/567463273 delays and ensure business-hours settings match expectations.
- Validate that `response_approval_timesheet_ids_array` is written back to timesheets after a decision.
- Confirm notifications (Phase 05) triggered by approval outcomes.

## Critical Paths (10 minutes)
- **Happy path:** Consultant selects timesheets → submits request form → workflow 567500453 creates HJ Approval → approver uses emailed link → decision workflow updates approval and timesheets → billing/notifications receive status change.
- **Internal approval path:** `approver_is = HJPetro` → module 96919533807 (internal UI) → workflow 1682422902 records decision and escalation notes.
- **External approval path:** `approver_is = PrimaryContact` → module 96920867313 + form 31f4d567 → workflow 1680618036 handles customer response, notifies sales owner.
- **Re-approval loop:** Reminders 567466561/567463273 send nudges; consultants can resubmit from the portal, flipping approval status back to “Submitted” and regenerating links.

## Data Dependencies (15 minutes)
- **Inputs:**
  - Contact object (0-1) carries approval_* fields, `submitted_as_timesheet_contact`, delegation data.
  - HJ Projects object supplies approver name/email/IS and sales owner metadata.
  - Timesheet object array (`approval_timesheet_ids_array`) from Phase 02.
- **Outputs:**
  - HJ Approvals object (2-26103010) populated with project, timesheet, and decision metadata.
  - Timesheets updated with `approval_outcome`, `response_approval_timesheet_ids_array`, processed date.
  - Notifications triggered for consultant, sales owner, and approver.
- **Cross references:** Contact-to-Approval mapping (docs/properties/contact-to-approval-mapping.md) and URL parameter mapping (docs/properties/url-parameter-sources.md).

## Common Tasks (30 minutes)
- **Debug a stalled approval:** pull the contact and approval record, inspect workflow run histories, requeue reminder workflows as needed, ensure notification workflows completed.
- **Add new approval fields:** update portal modules to collect the data, extend contact → approval mapping, refresh workflow 567500453 to write the field, and document the change in phases.json.
- **Adjust reminder cadence:** edit delays in workflows 567466561/567463273, update verification notes, and coordinate with notifications for revised messaging.
- **Audit delegation:** check `submitted_as_timesheet_contact`, ensure delegated approvals use the correct contact, and add regression tests in verification logs.

## Agent-Specific Notes
- Use the contact record as the source of truth; approval workflows enroll on the contact, not the HJ Approvals object.
- `approver_is` drives the entire branching logic—confirm the value before diagnosing decision workflows.
- Keep the portal modules and form IDs in sync with HubSpot exports; mismatches cause enrollment failures.
- Every approval run should leave an audit trail in `approval_notes` and notification logs—flag missing entries.

## Asset Quick Reference
- **Workflows:** 567500453 (request intake), 1680618036 (external decision), 1682422902 (internal decision), 567466561 & 567463273 (reminders).
- **Forms:** 5dd64adc (approval request), 31f4d567 (external approval response).
- **Modules:** 161468337269 (timesheet management approval), 96919533807 (internal interface), 96920867313 (external interface).
- **Objects:** Contact (0-1), HJ Approvals (2-26103010), HJ Timesheets (2-26173281).

---
Last updated: 2025-09-19 – ensure future edits begin with `npm --prefix config run generate:docs` followed by `python analysis/timesheet_process/shared/verification/verify_phase.py --phase 03-approval`.