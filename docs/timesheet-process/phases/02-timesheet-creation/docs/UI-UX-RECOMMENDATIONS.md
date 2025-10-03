# Timesheet Creation UI/UX Architecture & Recommendations

This guide inventories the modules, pages, and interaction patterns that power the consultant timesheet portal (Phase 02) and outlines improvements to deliver a consistent experience before approvals begin.

## 1. Primary User Flows

| Flow | Modules / Pages | Purpose | Notes |
| --- | --- | --- | --- |
| Project selection | `hjp-insert-timesheet-0-select-project.module` (`/insert-timesheet-step-0`) | Decrypt consultant token, list authorised projects, route into creation flow. | Uses inline HubL + jQuery for filtering; project cards have inconsistent spacing when more than 3 results. |
| Line-item entry | `hjp-insert-timesheet-01.module`, `hjp-insert-timesheet-02-01.module`, `hjp-new-timesheet-entry-03.module`, `hjp-new-timesheet-entry-04-redirect.module` | Collect well, dates, units, quantity; poll until line items appear. | Heavy inline CSS, repeated markup, manual query-string stitching, auto-refresh timers without user messaging. |
| Timesheet management | `hjp-insert-timesheet-06-my-timesheets.module` (`/insert-timesheet-my-timesheets`) | Display created/submitted/approved items, surface update/delete CTAs, trigger approval requests. | Uses multiple HubL queries per status, hard-coded tooltip copy, 10s auto-refresh reloads entire DOM. |
| Update flow | `hjp-update-timesheet-01/02/03/04` modules + `Update Timesheet` form | Edit line items prior to approval. | Same styling issues as creation flow, plus duplicate logic for status validation. |
| Delete flow | `hjp-delete-timesheet-01/02` modules + `Delete Timesheet` form | Confirm removal of line items. | Minimal confirmation UI, relies on workflow success for feedback. |
| Rejected resubmission | `hjp-update-rejected-timesheet-*` modules | Allow edits after rejection prior to re-request. | Shares code with update modules but diverges in button styles and copy. |

## 2. Component Inventory

| Component | Implementation | Issues |
| --- | --- | --- |
| Multi-step navigation buttons | Inline `<a>` / `<button>` elements with jQuery `.click()` handlers | Inconsistent classes (`btn-next`, `timesheet-button`), no disabled state, reliance on `window.location`. |
| Status tables | HubL-generated `<table>` with mixed inline CSS | No responsive behaviour, lacks accessibility attributes, repeated table header markup per section. |
| Auto-refresh loaders | `setTimeout(window.location.reload, ...)` across modules | Causes flicker/jump, no progress indicator, refresh interval duplicated in each module. |
| Modal/confirmation patterns | Plain `<div>` overlays toggled by jQuery | No focus trapping, close buttons inconsistent, not keyboard accessible. |
| Error notifications | Hard-coded `<p>` elements toggled by class | Non-standard messaging, lacks ARIA role, messages sometimes hidden on refresh. |

## 3. Pain Points & Themes
- **Styling fragmentation:** Every module embeds its own CSS block; colours, fonts, and grid layouts drift between steps (especially update vs create flows).
- **JavaScript duplication:** Query parameter parsing, form validation, and reload timers are reimplemented in each module with minor string changes.
- **Accessibility gaps:** No keyboard focus management, tables without captions, auto-refresh breaking screen readers, and confirmation dialogues lacking semantics.
- **Feedback latency:** Consultants receive little feedback while WF-11 processes items; reload-based polling obscures partial failures.
- **Form UX debt:** Uses HubSpot forms for update/delete flows with no client-side validation beyond `required`, making errors surface only after workflow actions.

## 4. Recommendations

| Area | Recommendation | Benefit |
| --- | --- | --- |
| Shared UI kit | Create a Timesheet portal stylesheet + JS helper (`timesheet-portal.css/js`) to standardize buttons, tables, toasts, and URL utilities. | Removes inline CSS, reduces drift, makes feature work easier for agents. |
| State feedback | Introduce lightweight status component (spinner + message) that reflects WF-11 progress using polling endpoint or loader slot. | Gives consultants visibility into processing delays instead of auto-refresh loops. |
| Accessibility | Add ARIA roles, captions, focus trapping for confirmation panels, and skip links for auto-refresh sections. | Meets accessibility expectations and prevents user disorientation. |
| Modular templates | Break large modules into partials (header, entry form, summary table) rendered via macros or HubDB. | Encourages reuse across create/update/resubmit flows and simplifies maintenance. |
| Validation | Implement shared JS validation (dates, quantity, duplicate wells) before submitting forms; display inline error states. | Reduces malformed payloads that currently rely on WF-11 cleanup. |
| Notifications | Replace HTML string links in CRM with HubSpot CRM cards/UI extensions pointing to portal actions. | Delivers consistent branding and easier maintenance when URLs change. |

## 5. Integration with Agent Instructions
- Align new UI work with `analysis/timesheet_process/shared/agent-quick-start.md` once updated so agents default to the shared UI kit before modifying modules.
- When generating or updating modules, flag lingering inline CSS/JS blocks so the refactor backlog captures stragglers.
- Before publishing portal changes, ensure verification logs confirm module filenames referenced in `TRACE.md` match exported assets.

## 6. Follow-up Tasks
- Draft the shared `timesheet-portal.css/js` assets and migrate one pilot module (`hjp-insert-timesheet-02-01.module`) to prove the pattern.
- Add an accessibility smoke-test checklist (keyboard navigation, focus order, status messages) to agent runbooks for Phase 02 work.
- Evaluate replacing jQuery dependencies with vanilla JS or HubSpot module event APIs to simplify bundling.
- Prototype a status workflow or CRM action (custom-coded) that the portal can poll instead of forcing full page reloads every 10 seconds.

