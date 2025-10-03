# Timesheet Creation Implementation Methods – Comparison

Reference for how Phase 02 constructs and manages timesheet data across workflows, CMS modules, and HubSpot objects. Use it to spot consolidation opportunities and keep automation aligned.

## 1. Workflow Automation Patterns

| Method | Where Used | What It Does | Strengths | Risks / Pain Points | References |
| --- | --- | --- | --- | --- | --- |
| **Node custom code (batch create)** | WF-11 `Insert Line Items` (`workflow-567497868-v4.json`) | Reads `cg_*` arrays from contact, fetches rates from `hj_consultants`, batch-creates `hj_timesheets`, sets unique IDs and billing metadata. | Handles multi-line submissions efficiently, dedupes via search, centralizes billing logic. | 500+ lines of inline code, no shared utilities, relies on positional arrays, limited error reporting back to portal. | `data/raw/workflows/workflow-567497868-v4.json` |
| **Node custom code (association + link)** | WF-10 `Notify Consultant and Associate to Project` (`v4-flow-567406596.json`) | Associates contact ↔ project, regenerates encrypted timesheet link, sends notification email. | Ensures only approved consultants access portal; reuses encryption pattern from WF-01. | Hard-coded template ID, encryption offset inline (`+3522`), minimal logging. | `data/raw/workflows/v4-flow-567406596.json` |
| **Delete via API** | WF-12 `Delete Line Items` (`v4-flow-567296849.json`) | Deletes `hj_timesheets` records when `timesheet_trigger_status` = `Delete Existing`. | Simple cleanup, re-enrollable, ensures orphaned lines removed quickly. | No confirm back to portal; relies on forms to set correct trigger; update workflow missing equivalent pattern. | `data/raw/workflows/v4-flow-567296849.json` |
| **Form-driven custom code gaps** | (Missing) Update workflow referenced by `Update Timesheet` form | Expected to patch timesheet records but export not present. | n/a | Documentation gap—agents must confirm whether automation runs outside HubSpot or re-export workflows. | `data/raw/hubspot-cms-api/forms/cms_forms_data.json` (guid `019ffc90-3a87-4970-9dc8-d6fb400747ad`) |

### Observations
- WF-11 performs all critical validation/creation logic in a single custom code node; failures do not propagate messages back to the consultant UI.
- WF-10 and WF-11 both contain URL generation logic (encryption, timesheet portal links) that should move to a shared service to avoid drift.
- WF-12 deletes records outright without archiving; consider soft-delete or status flag if audit requirements tighten.

## 2. CMS Module Patterns

| Method | Where Used | What It Does | Strengths | Risks / Pain Points | References |
| --- | --- | --- | --- | --- | --- |
| **HubL + jQuery multi-step flow** | `hjp-insert-timesheet-0/01/02-01`, `hjp-new-timesheet-entry-03/04` | Guides consultant through project selection, line entry, polling for completion. | Familiar with existing theme, quick to modify in HubSpot. | Inline CSS/JS duplication, manual query strings, no centralized validation, heavy reliance on reload loops. | Module exports under `data/raw/hubspot-cms-assets/Timesheets-Theme/modules/` |
| **Timesheet dashboard table** | `hjp-insert-timesheet-06-my-timesheets.module` | Lists timesheets by status, exposes update/delete CTA buttons, triggers approval request. | Single module controls entire dashboard; reuses CRM queries to show real-time data. | Multiple HubL queries per status, polling refresh every 10 seconds, HTML buttons encode action context causing maintenance overhead. | `data/raw/hubspot-cms-assets/Timesheets-Theme/modules/hjp-insert-timesheet-06-my-timesheets.module` |
| **Update / delete wizards** | `hjp-update-timesheet-*`, `hjp-delete-timesheet-*` | Walk consultants through updating or deleting a line item before approval. | Keeps flows consistent with creation steps, uses hidden fields to carry context. | Separate modules for update vs rejected update, repeated CSS, depend on WF-11 update logic staying in sync with portal payloads. | Module exports under `Timesheets-Theme/modules/` |

### Observations
- Modules rely on global jQuery and inline scripts; no bundling or shared helper file exists for query parsing or status messaging.
- Update submissions rely on WF-11 to detect existing records via `timesheet_unique_id`; keep portal ordinal numbers aligned so updates patch the correct line items.
- Update submissions rely on WF-11 to detect existing records via ; keep portal ordinal numbers aligned so updates patch the correct line items.
- Approval request buttons are hard-coded `<a>` tags pointing to forms; migrating to CRM cards or custom-coded workflow endpoints would simplify maintenance.
- Polling refresh loops consume resources and can interrupt accessibility tools; prefer explicit status endpoint or progressive enhancement.

## 3. Property & Data Storage Patterns

| Data Type | Storage Pattern | Pros | Cons | References |
| --- | --- | --- | --- | --- |
| Line-item staging arrays | Contact properties (`cg_*`, `quote_*`) populated by portal modules | Avoids creating extra custom objects for draft lines; portal can resubmit easily. | Vulnerable to delimiter mismatch, no schema validation, difficult to troubleshoot when arrays misalign. | WF-11 source, `cms_forms_data.json` |
| Timesheet billing metadata | `hj_timesheets` properties (`timesheet_*`, `bill_*`, `terms__number_format_`) | Stores all pricing/GL context on each line for downstream billing. | Re-computing requires rerunning WF-11; no history of changes if update workflow missing. | `data/raw/ai-context/ai-context-export/data-model/hj_timesheets-schema-2-26173281.json` |
| Portal access links | Contact property `hj_notify_timesheet_link` with HTML anchor | Gives CRM users a one-click entry into portal. | HTML string brittle, accessible styling inconsistent, not theme aware. | WF-10 export |
| Delete triggers | Contact & timesheet property `timesheet_trigger_status` | Simple flag for workflows to detect remove requests. | No equivalent for updates/resets; depends on forms writing exact string values. | WF-12 export |

### Observations
- Timesheet storage is consistent once WF-11 runs, but the staging arrays on contacts create opaque failures when modules or forms diverge.
- No audit trail exists for updates; without export for the update workflow, agents must verify how changes propagate (new record vs patch).
- HTML-based links in CRM should be replaced with UI extensions or centralized URL service to avoid manual HTML editing.

## 4. Consolidation Opportunities
- Introduce a shared HubSpot custom-coded workflow action for URL/token generation consumed by WF-01, WF-10, and future portal updates.
- Build a reusable front-end helper (query parsing, validation, status messaging) included by all timesheet modules to remove duplicate JS.
- Capture a mini schema for `cg_*` arrays (fields, order, delimiter) and validate before WF-11 runs to prevent partial creations.
- Document or re-export the Update workflow so agents know whether edits patch existing timesheets or recreate them.
