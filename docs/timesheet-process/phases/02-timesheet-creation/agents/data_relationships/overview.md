# Phase 02 Data Relationships Overview

*Captures the key objects, schemas, and association IDs that underpin timesheet creation.*

## Core Objects
- `hj_timesheets` (2-26173281): stores individual line items with pricing, approval, and association fields.
- `hj_consultants` (2-26103040): provides consultant/project/well pricing context consumed by WF-11.
- Contact (0-1): staging ground for `cg_*`, `quote_*`, and approval arrays.
- `hj_projects` (2-26103074): referenced via IDs to keep timesheets aligned with project master data.

## Associations
- Contact ↔ Project (Association 210) established by WF-10.
- Contact ↔ Timesheet (Association 280) inferred via stored consultant IDs and created automatically by HubSpot.
- Timesheet ↔ Form Submission (IDs 251/252) for audit tracing of insert/update/delete forms.
- Timesheet ↔ Note/Task/Email (IDs 237/233/231) used later during approvals.

## Data Flow Reminders
1. Portal writes `cg_*` arrays → WF-11 reads arrays, queries `hj_consultants`, and creates timesheets.
2. WF-11 writes `timesheet_approval_status` = `Created`; dashboard updates contact approval arrays when consultant requests approval.
3. WF-12 removes line items based on the trigger status to keep relationships clean.

_Keep these relationships synchronized when extending the portal or workflows to avoid orphaned data._
