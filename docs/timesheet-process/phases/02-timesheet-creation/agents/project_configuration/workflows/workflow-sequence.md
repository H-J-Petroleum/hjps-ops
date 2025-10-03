# Workflow Sequence

## WF-10 Notify Consultant and Associate to Project (`567406596`)
- **Trigger:** Contact submits Notify Consultant form (`4d7f4f8d-5ed7-42d9-bb3e-81255c0fc2db`) after scope approval completes.
- **Action 1:** Custom code associates the consultant contact to `hj_projects` via Association 210, using `hj_notify_project_object_id` captured on the contact.
- **Action 2:** Custom code refreshes consultant metadata, encrypts the contact ID (`+3522` offset), builds the `/insert-timesheet-step-0` link, and writes HTML button to `hj_notify_timesheet_link`.
- **Action 3:** Sends notification email (template `161209165695`) with the generated portal link.
- **Output:** Consultant contact now linked to the project, receives refreshed portal URL, and can access the Step 0 module.

## Portal Flow Alignment
1. WF-10 writes notification properties →
2. Consultant launches Step 0 module (`hjp-insert-timesheet-0-select-project.module`) →
3. Contact staging fields (`cg_*`, `quote_*`) populated across Step 1/2 modules for WF-11.

_Use this sequence to confirm portal access prerequisites before debugging WF-11 failures._
