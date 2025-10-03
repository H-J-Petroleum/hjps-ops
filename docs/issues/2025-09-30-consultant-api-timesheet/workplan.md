# Workplan: API Timesheet Backfill

## Goal
Create and submit Justin Lott's two-week timesheet backlog directly through the HubSpot API while preserving existing workflow behaviour (WF-11 creation, Phase 03 approvals).

## Milestones
1. **Discovery & Data Pull**
   - [ ] Retrieve consultant contact (`299151`), `hj_consultants` record, and project `hjp-15911-37197` details via the CRM API.
   - [ ] Confirm accessible wells and rate cards align with the requested list and $7,200/week total.
   - [ ] Validate that the associated recruiting and sales deals have cleared WF-01 and WF-03 gating per `analysis/process-analysis/comprehensive-process-map.md` (association labels, encrypted IDs, scope-of-work URLs).
   - [ ] Capture key association IDs and property names from the Phase 01 data architecture docs so helper scripts reference the correct labels (Deal↔Well 128, Consultant↔Project 210, etc.).
   - [ ] Log any schema assumptions in a format compatible with the toolbox schema registry (MariaDB mirror) to keep downstream services synchronized.
2. **Payload Design**
   - [ ] Decide on staging vs. direct timesheet creation, referencing WF-11 mapping (`analysis/timesheet_process/phases/02-timesheet-creation/docs/DATA-ARCHITECTURE.md`) and upstream dependencies captured in the comprehensive process map.
   - [ ] Draft JSON payload templates per charge type (miles, per diem, day rate), capturing required fields (`timesheet_project_id`, `timesheet_well`, `timesheet_quantity`, `timesheet_price`, `timesheet_total_price`, etc.).
   - [ ] Encode rounding rules for 14-way well allocation with weekly separation.
   - [ ] Align payload staging with Phase 02 contact arrays (`cg_*`, `quote_*`) so WF-11-compatible data can be produced on demand, even when inserting directly via API.
   - [ ] Structure helper functions so they can migrate into the shared toolbox helper library (no inline HTML, isolated URL signing, reusable validation).
3. **Prototype Execution**
   - [ ] Create sandbox entries for a single well/week and validate associations and totals via GET calls, ensuring well associations (type 128) match process map expectations.
   - [ ] Verify that created records populate approval arrays or equivalent properties expected by Phase 03, documenting any gaps for the broader refactor.
   - [ ] Capture verification steps/results in the format expected by the toolbox testing strategy for future automation.
   - [ ] Verify PDFs/approval notes still render (consult Phase 03 docs if issues arise).
4. **Bulk Automation**
   - [ ] Implement script (Node preferred for HubSpot SDK parity) with safeguards: idempotent retries, logging, dry-run mode.
   - [ ] Batch through both weeks and wells; confirm totals reconcile to $14,400.
5. **Post-Insert Alignment**
   - [ ] Update approval arrays (`response_approval_timesheet_ids_array`) or queue WF-11 to do so automatically.
   - [ ] Document validation steps, attach evidence (object IDs) in this issue folder.

## Technical Notes
- Node environment already configured under `config/`; reuse existing HubSpot credential handling per `config/hubspot-config.yml`.
- For staging approach, ensure WF-11 re-enrollment criteria (`timesheet_trigger_status`) are satisfied without disrupting other contacts.
- When inserting directly, include associations: consultant contact, project object, and wells (via payment deal ID if required).
- Use `crm/v3/objects/{objectType}/batch/create` to minimise API calls while respecting rate limits.

## Validation Checklist
- [ ] Totals per well and per week equal the allocation table in `README.md`.
- [ ] Each created timesheet includes start/end dates matching week boundaries (or per-day entries if chosen).
- [ ] Approval workflows detect the new entries (`timesheet_approval_status = Created`).
- [ ] Consultant portal shows the entries without manual intervention.

## Risks & Mitigations
- **Rate mismatch:** If live rates differ from assumed totals, adjust allocation upstream before insert.
- **Workflow side effects:** Test in sandbox; if WF-11 is reused, throttle submissions to avoid hitting recursion limits.
- **Duplicate entries:** Implement dedupe by `timesheet_unique_id` or a custom external ID to allow safe re-runs.

## Dependencies
- HubSpot private app token with scope `crm.objects.custom.read/write` and `crm.associations.read/write`.
- Confirmation from operations on preferred granularity (daily vs. weekly aggregates).
