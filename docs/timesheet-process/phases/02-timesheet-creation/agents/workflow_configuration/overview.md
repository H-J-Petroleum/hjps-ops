# Workflow Configuration Overview

*Summarises the automation responsible for creating, updating, and cleaning up timesheet records during Phase 02.*

## Scope
- WF-11 `Insert Line Items` (ID 567497868)
- WF-12 `Delete Line Items` (ID 567296849)
- Form-triggered flows for update/resubmit (exports pending) that interact with WF-11 inputs.

## Responsibilities
- Parse contact staging arrays and create `hj_timesheets` records with pricing and association metadata.
- Generate deterministic IDs and billing descriptions used later by approvals and billing.
- Remove timesheet records on demand to keep associations clean.

## Dependencies
- Portal modules must maintain the `cg_*` fields expected by WF-11.
- Consultant pricing in `hj_consultants` must stay current to avoid empty totals.
- Delete workflow relies on `timesheet_trigger_status` being set by portal forms.

_Collect all workflow exports before modifying logic to avoid accidental divergence from live HubSpot configuration._
