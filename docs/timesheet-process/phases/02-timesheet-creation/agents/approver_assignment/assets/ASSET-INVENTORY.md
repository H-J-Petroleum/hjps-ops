# Asset Inventory

| Asset | Type | Description | Reference |
| --- | --- | --- | --- |
| `hjp-insert-timesheet-06-my-timesheets.module` | CMS module | Dashboard listing created/submitted/approved timesheets, exposes approval and resubmit CTAs. | `data/raw/hubspot-cms-assets/Timesheets-Theme/modules/hjp-insert-timesheet-06-my-timesheets.module` |
| Consultant Approval Request form | HubSpot form | Launches initial approval request with staged properties. | ID `5dd64adc-00b2-4cfa-a69f-4cb068c5c55f` in `data/raw/hubspot-cms-api/forms/cms_forms_data.json` |
| Consultant Re-Approval Request form | HubSpot form | Resubmits rejected timesheets for another approval cycle. | ID `f45d58de-38c3-441e-b344-2e6c6187b272` in `data/raw/hubspot-cms-api/forms/cms_forms_data.json` |
| `hj_timesheets.timesheet_approval_status` | Custom object property | Tracks status transitions (Created → Submitted → Approved/Rejected). | `data/raw/ai-context/ai-context-export/data-model/hj_timesheets-schema-2-26173281.json` |
| `hj_timesheets.timesheet_approval_request_id` | Custom object property | Links line items to approval request identifiers set by Phase 03. | `data/raw/ai-context/ai-context-export/data-model/hj_timesheets-schema-2-26173281.json` |
| Contact approval fields `approval_*`, `approver_*` | Contact properties | Carry metadata required for Phase 03 workflows (project, dates, approver details). | `data/raw/ai-context/ai-context-export/data-model/contacts_schema.json` |
