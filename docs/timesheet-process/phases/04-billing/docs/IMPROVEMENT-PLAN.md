# Billing Improvement Plan

Document the billing workflows, data sync, and verification artefacts needed to enable invoicing.

## 1. Immediate Priorities
- Define billing notification outputs (invoice sent, payment reminders) and where they integrate with shared notifications.
- Inventory HubSpot workflows that move approved timesheets into billing (IDs, triggers, outputs).
- Capture data flow from HJ Approvals / HJ Timesheets to any external billing systems.
- Identify existing manual steps (spreadsheets, external databases) that should be mirrored in documentation.

## 2. Required Artefacts
- Data architecture summary for billing objects (properties on HJ Timesheets, deals, invoices).
- Workflow trace covering rate calculation, invoice generation, payment tracking.
- Verification plan (what exports/logs prove billing runs correctly).

## 3. Dependencies
- Phase 03 approval outcomes and response fields.
- Any scripts or integrations living under scripts/ or external systems.

**Status:** TODO – compile source materials before next documentation generation run.