# Portal Access & Context Staging Overview

*Phase 02 sub-process covering how consultants gain access to the timesheet portal and how context is staged for WF-11.*

## Purpose
Enable approved consultants to enter the portal, mirror their project associations, and stage all contact-level data (`cg_*`, `quote_*`) required for batch creation of timesheets.

## Process Flow
1. **Scope approval completes** → WF-09 triggers Notify Consultant form.
2. **WF-10** associates consultant to `hj_projects`, regenerates encrypted portal link, emails timesheet instructions.
3. **Portal Step 0** decrypts consultant ID, lists authorised projects, enforces lock state (`hj_project_is_locked`).
4. **Steps 1–2** collect well/unit/date data and write staging arrays (`cg_*`, `quote_*`) on the contact.
5. **Step 3/4** validate that WF-11 created the expected number of line items before handing off to the dashboard.

## Key Components
- **Workflows:** WF-10 `Notify Consultant and Associate to Project`.
- **Modules:** `hjp-insert-timesheet-0-select-project`, `hjp-insert-timesheet-01`, `hjp-insert-timesheet-02-01`, `hjp-new-timesheet-entry-03`, `hjp-new-timesheet-entry-04-redirect`.
- **Forms:** `4d7f4f8d-5ed7-42d9-bb3e-81255c0fc2db`, `f2b89ea4-cae8-42ad-845b-ff5a25dc299a`.
- **Properties:** `hj_notify_*`, `cg_*`, `quote_*`, `submitted_as_timesheet_contact`.

## Integration Points
- **Upstream:** Requires Phase 01 WF-01/WF-03 data (project IDs, consultant metadata).
- **Downstream:** WF-11 consumes staged arrays; WF-12/Phase 03 rely on `approval_timesheet_ids_array` seeded later in the dashboard.
- **Shared data:** Consultant/project association (Association 210), encrypted consultant ID, project lock state.

## Key Assets
- **Properties:** `properties/property-mapping.json` summarises contact + timesheet fields.
- **Workflows:** `workflows/workflow-sequence.md` documents WF-10 actions and alignment with portal steps.
- **Modules:** Listed in `assets/ASSET-INVENTORY.md` with export paths for quick inspection.
- **Verification:** Use the command in `tools/TOOLS.md` before modifying modules or WF-10.
