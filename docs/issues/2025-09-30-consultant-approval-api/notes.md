# Discovery Notes

## Key Assets
- **WF-13** (`workflow-13-567500453-v4.json`)
  - Branches on `approver_is`.
  - Custom code action creates a new `hj_approval` object (custom object `2-26103010`), sets initial status fields, and writes `approval_request_id` / `approval_object_record_id` back to the contact.
  - Subsequent actions (IDs 2, 11, etc.) send emails; remaining steps still need parsing for status updates and reminders.
- **Approval submission module** (`hjp-line-items-approval-01.module` & related backups)
  - Submits HubSpot form `5dd64adc-00b2-4cfa-a69f-4cb068c5c55f` with fields:
    - `response_approval_timesheet_ids_array`
    - `response_approval_project_name`
    - `response_approval_project_id`
    - `response_approval_customer`
    - `response_approval_operator`
    - `response_approval_consultant_name`
    - `response_approval_consultant_email`
    - `response_approval_deal_owner_email`
    - `response_approval_consultant_id`
    - `response_approval_sales_deal_id`
    - `response_approval_owner_id`
    - `response_approval_from_date`
    - `response_approval_until_date`
    - `approval_processed_date`
    - `quote_customer_primary_contact_id`
    - `submitted_as_timesheet_contact`
    - `response_approval_request_id`
- **Contact staging properties** (already updated in previous step):
  - `approval_timesheet_ids_array` now contains 84 new timesheet IDs.
  - `approval_from_date` / `approval_until_date` set to 09/15/2025–09/26/2025.
  - Additional properties (`approval_project_*`, `approval_sales_deal_id`, `approver_*`) must be retrieved or supplied before mimicking the form.

## Required API Actions
1. Build approval payload matching the form submission.
2. POST to `https://api.hsforms.com/submissions/v3/integration/submit/1230608/5dd64adc-00b2-4cfa-a69f-4cb068c5c55f` (primary path) or directly create `hj_approval` object + contact updates via CRM API (replicating WF-13 step-by-step).
3. Ensure reminders/emails triggered by WF-13 still fire (workflow may rely solely on contact properties & new approval object).

## Open Questions
- Do we have current values for `approver_full_name`, `approver_email`, `approver_is`, etc.? If not, we need to fetch from HubSpot before constructing the payload.
- After bypassing the form, should we skip the HS Forms API and post directly to CRM, or do both for parity?

Next step: extract full WF-13 custom code output (timesheet status updates, etc.) and identify any additional actions we must mirror.

## 2025-09-30 Execution Snapshot
- Script `run-approval-request.mjs` created approval object `35708567971` and request `hjp-15911-37197-299151-1759252237689`.
- 84 timesheets updated to `Submitted`, linked to the new approval object, and re-tagged with invoice suffix `0690`.
- Deal note `90201278493` added to sales deal `16647461296`; internal task skipped (customer approver).
- Approver contact received refreshed approval link HTML matching portal button styling.
- Summary log: `analysis/issues/2025-09-30-consultant-approval-api/data/approval-run-2025-09-30T17-10-41-282Z.json`.
