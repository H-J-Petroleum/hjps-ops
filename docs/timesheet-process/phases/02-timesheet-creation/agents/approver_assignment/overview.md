# Handoff to Timesheet Approval Overview

*Phase 02 sub-process covering how consultants gain access to the timesheet portal and how context is staged for WF-11.*

## Purpose
Document the contact and timesheet properties, forms, and workflows that bundle timesheet IDs into approval requests so Phase 03 workflows can process them.

## Process Flow
1. Consultant reviews line items in `hjp-insert-timesheet-06-my-timesheets.module`.
2. Consultant clicks `Request For Approval` → HubSpot form `Consultant Approval Request` (ID `5dd64adc-00b2-4cfa-a69f-4cb068c5c55f`).
3. Contact properties such as `approval_timesheet_ids_array`, `approval_project_id`, and `approver_email` are refreshed.
4. Phase 03 WF-08/WF-09 consume those properties to queue approvals (read-only from Phase 02 perspective).
5. If a timesheet is rejected, the consultant uses `Consultant Re-Approval Request` (ID `f45d58de-38c3-441e-b344-2e6c6187b272`) to resubmit the same IDs.

## Integration Points
- **Inputs:** `hj_timesheets` records produced by WF-11, staged contact arrays (`approval_timesheet_ids_array`, `approval_project_*`).
- **Outputs:** Phase 03 workflows read the staged arrays and update `hj_timesheets.timesheet_approval_status` accordingly.
- **Dependencies:** Approver contact metadata (`approver_email`, `approver_is`, `approver_unique_id`) must be present from Phase 01/03 configuration.

## Key Assets
- **Forms:** IDs `5dd64adc-00b2-4cfa-a69f-4cb068c5c55f` (initial request) and `f45d58de-38c3-441e-b344-2e6c6187b272` (re-approval).
- **Modules:** `hjp-insert-timesheet-06-my-timesheets.module` provides the UI for selecting timesheets and launching forms.
- **Properties:** Contact fields `approval_*`, `approver_*`, `submitted_as_timesheet_contact`; timesheet fields `timesheet_approval_status`, `timesheet_approval_request_id`.
