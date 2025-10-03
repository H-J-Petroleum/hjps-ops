# Timesheet Creation Improvement Plan

Actionable roadmap for hardening Phase 02 after documenting the trace, data architecture, and UI/UX patterns.

## 1. Key Dependencies & Gaps
- **WF-11 auditability:** No user-facing feedback or error logging when batch creation fails; portal reload simply loops.
- **Update workflow documentation:** Capture how the existing `Update Timesheet` form feeds the current automation (WF-11 update path) and make sure the export is stored for future reference.
- **Array staging quality:** Contact-level `cg_*` arrays rely on modules writing identical delimiters/order; gaps cause partial batches without flagging consultants.
- **Portal link management:** `hj_notify_timesheet_link` still uses inline HTML; migrating to CRM cards or UI extensions is prerequisite for consistent UX.
- **Approval dependencies:** Phase 03 workflows expect `approval_timesheet_ids_array` and `timesheet_approval_status`; ensure any refactor keeps these properties intact.

## 2. Data Architecture Recommendations
| Action | Impact |
| --- | --- |
| Validate contact arrays before WF-11 runs (mini schema + guardrail script). | Prevents malformed `cg_*` payloads from creating incomplete line items. |
| Add status/notes to `hj_timesheets` for workflow outcomes (`creation_status`, `creation_notes`). | Surfaces success/failure to portal and audit logs. |
| Centralize URL/token generation within a shared HubSpot custom-coded workflow action or library so all flows reuse the same logic. | Removes duplicated encryption logic across WF-01, WF-10, and future modules. |
| Capture update/delete history (timestamp, actor) on `hj_timesheets`. | Enables audit trail once update workflow is confirmed/implemented. |

## 3. UI/UX Recommendations
| Action | Impact |
| --- | --- |
| Implement shared `timesheet-portal.css/js` and migrate core modules (Step 0, Step 2, dashboard). | Eliminates inline styling, unifies button/table behaviour, speeds future edits. |
| Add inline validation and status toasts to creation/update flows. | Reduces reliance on page reloads and clarifies WF-11 progress for consultants. |
| Replace HTML CRM links with HubSpot UI extensions or custom-coded workflow outputs referencing the shared token logic. | Consistent, responsive launch points for timesheet portal. |
| Introduce accessibility review checklist (focus order, ARIA roles, polling behaviour). | Ensures portal remains usable for all consultants and meets compliance goals. |

## 4. Workflow & Automation Recommendations
| Action | Impact |
| --- | --- |
| Wrap WF-11 custom code with structured logging (success/failure, counts) saved to a custom object or log file. | Makes troubleshooting easier and enables dashboard visibility. |
| Add guardrail check before WF-12 delete (confirm `timesheet_trigger_status` set by form submission timestamp). | Prevents accidental deletes triggered by stale property values. |
| Re-export or rebuild the Update workflow; document whether timesheet edits patch records or recreate them. | Clarifies process for agents and prevents duplicate line items. |
| Consider soft-delete pattern (status flag) to retain history for billing disputes. | Maintains audit trail while still hiding removed entries from portal view. |

## 5. Immediate Next Steps
- Document notification triggers (submission confirmations, failure alerts) handoff to Phase 03 approvals.
1. Run `analysis/timesheet_process/shared/verification/verify_phase.py --trace analysis/timesheet_process/phases/02-timesheet-creation/docs/TRACE.md --phase-dir analysis/timesheet_process/phases/02-timesheet-creation --log-dir analysis/timesheet_process/phases/02-timesheet-creation/verification/logs` to confirm documentation alignment.
2. Document how the existing update workflow operates (current logic hooks into WF-11); capture export details and note expected behaviour so future changes avoid duplicate records.
3. Prototype the shared `timesheet-portal.css/js` assets and convert one module (Step 2) to use them.
4. Add structured logging to WF-11 and surface a success/failure indicator in the portal dashboard (toast or status column).
5. Move CRM launch links from `hj_notify_timesheet_link` HTML buttons to a custom-coded workflow output or UI extension tied to the shared token logic.
6. Prepare an accessibility smoke-test checklist to run whenever modules or workflows impacting the portal change.


