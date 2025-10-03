# Timesheet Creation End-to-End Trace

Comprehensive walkthrough of Phase 02, covering the consultant portal, HubSpot workflows, and custom object writes that culminate in the approval handoff.

> Generated via scripts/agent-core/generate-phase-docs.js using shared/source/phases.json

## 1. Phase Overview

- **Process summary:** `analysis/timesheet_process/phases/02-timesheet-creation/docs/overview.md`
- **Source data:**
  - `data/raw/workflows/`
  - `data/raw/hubspot-cms-assets/Timesheets-Theme/modules/`
  - `data/raw/hubspot-cms-api/forms/cms_forms_data.json`
- **Dependencies:**
  - WF-01 consultant URL generation (link_for_consultant)
  - WF-03 project validation (hj_project_* + hj_notify_* properties)
  - WF-10 notification trigger for consultant access

Operational sequence: consultant portal access -> project context load -> line-item authoring -> WF-11 timesheet creation -> portal management & approval request handoff.

## 2. Portal Access & Authentication

**Purpose:** Deliver encrypted portal entry, associate consultant with the approved project, and surface the My Projects view.

| Step | Workflow / Asset | Trigger | Actions | Result |
| --- | --- | --- | --- | --- |
| 1 | WF-10 Notify Consultant and Associate to Project (567406596) | Contact submits Notify Consultant form (4d7f4f8d-5ed7-42d9-bb3e-81255c0fc2db) | Parse hj_notify_project_* properties, associate contact -> project (210), encrypt consultant ID, write hj_notify_timesheet_link, send email | Consultant receives /insert-timesheet-step-0 URL with encrypted parameters |
| 2 | Module hjp-insert-timesheet-0-select-project (module) | Consultant opens /insert-timesheet-step-0 | Decrypt consultant ID, resolve delegated contacts, load projects via association 210, block locked projects | Consultant sees authorised project list |

| Property / Label | URL Pattern | Source |
| --- | --- | --- |
| Portal entry | https://hjpetro-1230608.hs-sites.com/insert-timesheet-step-0?consultant_id={{encrypted}}&consultant_email={{email}}&consultant_name={{encoded}} | — |

## 3. Project Context & Line-Item Authoring

**Purpose:** Capture billable work, normalise units, and stage arrays for workflow ingestion.

| Step | Workflow / Asset | Trigger | Actions | Result |
| --- | --- | --- | --- | --- |
| 3 | Module hjp-insert-timesheet-01 (module) | Consultant advances to /insert-timesheet-step-1 | Load consultant record to retrieve deal IDs and wells, enforce project lock checks | Context pre-populated for entry |
| 4 | Module hjp-insert-timesheet-02-01 (module) | Consultant moves to step 2 | Pull consultant defaults, render entry form, capture units/quantity/notes | Consultant composes one or multiple line items |
| 5 | Module hjp-new-timesheet-entry-03 (module) | Entry count validation | Read hj_timesheets records, verify portal unlocked, poll for expected count | Ensures newly requested entries materialise before redirect |
| 6 | Module hjp-new-timesheet-entry-04-redirect (module) | Completion redirect | Validate created count, expose navigation to Step 0 or All Timesheets overview | Consultant returns to dashboard or management view |

### Notes
- Notification triggers (submission confirmations, error alerts) surface via Phase 03 approvals; ensure portal modules surface statuses.

- Hidden fields populate contact properties prefixed cg_* for WF-11
- Project locks enforced via hj_project_is_locked checks at each step

## 4. Workflow 11 - Timesheet Object Creation

**Purpose:** Convert staged arrays into structured hj_timesheets records and stamp billing metadata.

| Step | Workflow / Asset | Trigger | Actions | Result |
| --- | --- | --- | --- | --- |
| 7 | WF-11 Timesheet Object Creation (567497868) | Contact submits Insert Line Items form (f2b89ea4-cae8-42ad-845b-ff5a25dc299a) | Resolve direct vs delegated contacts, derive pricing from hj_consultants, normalise arrays, guard against duplicates, batch create, set timesheet_unique_id | hj_timesheets records created with pricing and approval status |

### Inputs

- cg_* arrays (dates, wells, units, quantities)
- quote_* billing terms
- hj_terms and hj_taxable from company feed
- submitted_as_timesheet_contact flag

### Outputs

- hj_timesheets populated with project, consultant, pricing, quantity, start/end dates & times
- Billing metadata (bill_account, bill_description, terms__number_format_)
- timesheet_approval_status = Created
- timesheet_unique_id = {project_id}-{objectId}

## 5. Portal Management & Approval Handoff

**Purpose:** Allow consultants to review, edit, delete, and request approval without touching Phase 03 assets.

| Step | Workflow / Asset | Trigger | Actions | Result |
| --- | --- | --- | --- | --- |
| 8 | Module hjp-insert-timesheet-06-my-timesheets (module) | Consultant opens My Timesheets view | Aggregate hj_timesheets by status, auto-refresh, surface CTA buttons | Consultant manages entries and triggers approval requests |
| 9 | Delete Timesheet form (ed044ad9-806e-4c94-b227-e2ae3b0f1a78) | Consultant requests deletion | Sets timesheet_trigger_status for WF-12 | WF-12 removes the targeted hj_timesheets record |
| 10 | WF-12 Delete Line Items (567296849) | timesheet_trigger_status = Delete Existing | Deletes hj_timesheets record by hs_object_id | Timesheet entry removed |

### Notes

- Approval request CTA posts selected timesheets into Phase 03 workflows (WF-08/WF-09)
- Status transitions: Created -> Submitted -> Approved/Rejected -> Resubmitted

## 6. Handoff to Phase 03

**Purpose:** Clarify data passed forward and restrictions on downstream assets.

### Notes

- Output properties: approval_timesheet_ids_array, response_approval_timesheet_ids_array, timesheet_approval_status, timesheet_approval_request_id
- Phase 02 must not alter Phase 03 workflows; document entry points instead

## 7. Validation Touchpoints

**Purpose:** Verification activities to run after documentation updates.

### Notes

- Run python3 analysis/timesheet_process/shared/verification/verify_phase.py --phase 02-timesheet-creation
- Confirm exports for WF-11, WF-12, and relevant modules remain in sync before closing tasks

