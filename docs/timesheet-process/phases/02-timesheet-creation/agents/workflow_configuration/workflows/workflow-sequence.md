# Workflow Sequence

## WF-11 Insert Line Items
1. Resolve context: read `cg_*`, `quote_*`, `submitted_as_timesheet_contact` to identify consultant/contact pair.
2. Pricing lookup: call HubSpot CRM search on `hj_consultants` for matching `consultant_id` and `hj_project_id`.
3. Array iteration: build per-line structures (wells, units, quantities) and compute totals for `timesheet_total_price` / `timesheet_hj_total_price`.
4. Batch create: POST to `/crm/v3/objects/2-26173281/batch/create`.
5. Post-process: update each record with `timesheet_unique_id` and ensure `timesheet_approval_status` = `Created`.

## WF-12 Delete Line Items
1. Enrollment: check `hs_object_id` known and `timesheet_trigger_status` matches allowed values.
2. Delete: issue DELETE request against `/crm/v3/objects/2-26173281/{id}`.
3. Any portal flow invoking a delete must reset `timesheet_trigger_status` afterwards to prevent repeat enrollments.
