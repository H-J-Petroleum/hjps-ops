# Asset Inventory

Overview of portal assets that stage consultant context for timesheet creation.

| Asset | Type | Description | Key References |
| --- | --- | --- | --- |
| `hjp-insert-timesheet-0-select-project.module` | CMS module | Entry point that decrypts consultant ID, lists authorised projects, links to Step 1. | `data/raw/hubspot-cms-assets/Timesheets-Theme/modules/hjp-insert-timesheet-0-select-project.module` |
| `hjp-insert-timesheet-01.module` | CMS module | Captures base context (project, deals) and forwards to detailed entry form. | `data/raw/hubspot-cms-assets/Timesheets-Theme/modules/hjp-insert-timesheet-01.module` |
| `hjp-insert-timesheet-02-01.module` | CMS module | Main data-entry form capturing wells, units, quantities; writes `cg_*` arrays. | `data/raw/hubspot-cms-assets/Timesheets-Theme/modules/hjp-insert-timesheet-02-01.module` |
| `hjp-new-timesheet-entry-03.module` | CMS module | Polls for workflow completion; validates counts before redirect. | `data/raw/hubspot-cms-assets/Timesheets-Theme/modules/hjp-new-timesheet-entry-03.module` |
| `hjp-new-timesheet-entry-04-redirect.module` | CMS module | Success page with navigation back to projects or dashboard. | `data/raw/hubspot-cms-assets/Timesheets-Theme/modules/hjp-new-timesheet-entry-04-redirect.module` |
| Notify Consultant form (`4d7f4f8d-5ed7-42d9-bb3e-81255c0fc2db`) | HubSpot form | Trigger that enrolls WF-10 to associate project and generate portal link. | `data/raw/hubspot-cms-api/forms/cms_forms_data.json` |
