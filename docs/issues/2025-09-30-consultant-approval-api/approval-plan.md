# Approval Request API Plan

## Required Data (per WF-13 & Portal Module)
- **Contact (`299151`)** must provide:
  - `approval_timesheet_ids_array` (comma-separated timesheet IDs)
  - `approval_project_id`, `approval_project_name`
  - `approval_customer`, `approval_operator`
  - `approval_sales_deal_id`, `approval_sales_deal_owner_email`, `approval_sales_deal_owner_full_name`
  - `approval_consultant_name`, `approval_consultant_email`, `approval_consultant_id`
  - `approver_full_name`, `approver_email`, `approver_unique_id`, `approver_is`
  - `approval_from_date`, `approval_until_date`, `approval_processed_date`
  - `quote_customer_name` (used for invoice second part)
  - `submitted_as_timesheet_contact`, `main_contact_id/email`
- **Timesheets (`hj_timesheets`)** for each ID need to be updated with:
  - `timesheet_approval_status = Submitted`
  - `timesheet_approval_request_id = <generated>`
  - `approval_object_record_id = <new approval object id>`
  - `processed_date`, `invoice_number_second_part`
- **Approver contact** (`approver_unique_id`) receives marketing-email link fields (`line_items_approval_link`, `approval_request_type`, `send_approval_*`).
- **Sales deal** requires note + task associations for owners.

## API Sequence to Replicate WF-13
1. **Collect context**
   - Read contact `299151` with fields listed above.
   - For delegates (`submitted_as_timesheet_contact = Yes`) fetch main contact overrides before proceeding.
   - Fetch sales deal (`approval_sales_deal_id`) for owner/contact metadata.
   - Fetch approver contact (`approver_unique_id`) for email + existing reminder fields.
   - Batch-read all timesheets in `approval_timesheet_ids_array` to gather wells and current status.
2. **Generate unique request ID**
   - Format: `{project_id}-{consultant_id}-{Date.now()+5-digit}`.
3. **Create approval object (`2-26103010`)**
   - Properties: `project_name`, `approval_customer`, `approval_operator`, `approval_project_id`, `approval_request_id`, `approval_approval_status='Submitted'`, `approval_status_date`, `approval_approval_from`, `approval_approval_until`, consultant + approver metadata, sales deal owner details.
4. **Patch consultant contact**
   - Set `approval_request_id`, `approval_object_record_id` (and keep `approval_timesheet_ids_array`).
5. **Update timesheets**
   - For each ID: `timesheet_approval_status=Submitted`, `timesheet_approval_request_id=<id>`, `approval_object_record_id=<approval object id>`, `processed_date=<approval_processed_date>`, `invoice_number_second_part=<quote_customer_name>`.
6. **Aggregate wells & update approval object + approver contact**
   - GET each timesheet’s `timesheet_well`; create unique list.
   - PATCH approval object with `approval_wells`, `send_approval_*` fields.
   - PATCH approver contact with the same `send_approval_*` values.
7. **Prepare customer-facing marketing email link**
   - Build link `field-ticket-for-approval-step-01` with query params (project_id, approval_request_id, customer_email, consultant_id+3522, approver_is, sales_deal_id).
   - PATCH approver contact with `send_approval_reminder='FirstTime'`, `line_items_approval_link`, `approval_request_type='Approval Request for Customer'`.
8. **Create deal note**
   - Compose HTML body summarizing consultant, period, project/customer/operator. Link to approval page.
   - POST `/crm/v3/objects/notes` and associate to deal (`typeId=214`).
9. **Create follow-up task for internal approver (when approver is H&J)**
   - Determine owner via `/crm/v3/owners?email=`.
   - POST `/crm/v3/objects/tasks` (high priority, due next business day) and associate to deal (`typeId=216`).
   - PATCH approval object with `approval_hj_task_id`.
   - Create marketing links for internal notifications (`approval_internal_page_link`, `approval_internal_sales_deal_link`, `approval_approver`) on the consultant/internal contact.
10. **(Optional) Update consultant & approver contacts with tracking dates**
    - If workflow sets `approval_from_date`/`approval_until_date` to display format, verify formatting (MM/DD/YYYY) and adjust if needed.

## Additional Considerations
- **Ordering:** follow WF-13 branch logic; duplicate steps for `approver_is = Primary Contact` and `approver_is = HJPetro` (different owner targets, task recipients, marketing template IDs).
- **Existing Records:** Earlier workflow attempt created approval object `35694806035` with partial data. New API runs should either update this object or create a fresh one and overwrite contact references.
- **Email Notifications:** WF-13 ends with action 11 (Marketing email) referencing template ID `161209165363` targeting `approver_email`. Sending emails via API may require either triggering Marketing Email send or replicating via transactional email. Decide whether to send via API or rely on separate process.
- **Idempotency:** store generated `approval_request_id` + `approval_object_record_id` for auditing and reruns.
- **Error logging:** mimic WF-13’s try/catch (stop on failure and surface error) so we do not leave partial updates.

## Execution 2025-09-30 17:10Z
- Ran `run-approval-request.mjs` against `data/approval-context-2025-09-30T16-37-20-976Z.json`.
- Created approval object `35708567971` with request ID `hjp-15911-37197-299151-1759252237689`.
- Patched contact `299151`, 84 timesheet records, and approver contact `437851` with current links.
- Logged deal note `90201278493`; internal task skipped (approver was `Primary Contact`).
- Output saved at `analysis/issues/2025-09-30-consultant-approval-api/data/approval-run-2025-09-30T17-10-41-282Z.json`.

### Outstanding Items
- Confirm marketing email template `161209165363` still fires when workflow is bypassed (or define replacement send).
- Decide whether to clean up superseded approval object `35694806035` or re-associate timesheets if needed.
- Extend script with optional internal follow-up execution log when `approver_is = 'HJPetro'`.
