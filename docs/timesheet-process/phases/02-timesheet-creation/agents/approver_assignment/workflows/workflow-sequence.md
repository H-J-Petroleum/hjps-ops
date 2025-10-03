# Workflow Sequence

## Consultant Approval Request (Form ➝ Phase 03)
1. Consultant selects rows in `hjp-insert-timesheet-06-my-timesheets.module` and submits form ID `5dd64adc-00b2-4cfa-a69f-4cb068c5c55f`.
2. Form submission writes `approval_*`, `approver_*`, `approval_timesheet_ids_array`, and `submitted_as_timesheet_contact` on the contact.
3. Phase 03 WF-08/WF-09 (read-only from this phase) pick up the staged values to create tasks, emails, and update `hj_timesheets.timesheet_approval_status` statuses.

## Consultant Re-Approval Request
1. Rejected timesheets trigger the `Consultant Re-Approval Request` form (ID `f45d58de-38c3-441e-b344-2e6c6187b272`).
2. Same property set is refreshed plus `approval_object_record_id` and optional comment fields for traceability.
3. Phase 03 WF-08/WF-09 reprocess the IDs and update `hj_timesheets.timesheet_approval_status` accordingly.

_Phase 02 owns the staging mechanics only; approval workflows remain documented under Phase 03._
