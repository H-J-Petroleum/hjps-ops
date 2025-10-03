# Timesheet Process Structure Status Summary

Current snapshot of the documentation structure and outstanding work.

Reference: [Strategic Execution Hub](../../docs/strategy/index.md) for phase ownership context.

## Overall Status
- Foundations (Phase 01) and Timesheet Creation (Phase 02) now run from the shared JSON source and generator.
- Remaining phases keep legacy layouts and require migration into the `phases/` tree.

## Directory Structure
- **`phases/01-foundation/`** – Project setup documentation (docs + agents + verification) – _In progress_ (scope QA and workflow activation gaps).
- **`phases/02-timesheet-creation/`** – Timesheet portal documentation – _In progress_ (update/delete workflows and delegated scenarios pending).
- **`phases/03-approval/`** – Approval process (legacy layout) – _Complete_ but needs migration to new structure.
- **`phases/04-billing/`**, **`phases/05-notifications/`** – Placeholders pending full authoring.
- **`shared/`** – Templates, source data, verification scripts, and agent tooling.

## Documentation Coverage
### Phase 01 – Foundations
- [x] Generated docs (`STATUS`, `TRACE`) tied to `shared/source/phases.json`.
- [x] Agent guides staged under `agents/`.
- [ ] Scope QA evidence and workflow activation plan.
- [ ] Automated schema regression checklist.

### Phase 02 – Timesheet Creation
- [x] Generated docs (`STATUS`, `TRACE`).
- [x] Portal module coverage in trace.
- [ ] Update/delete automation exports and verification.
- [ ] Delegated consultant scenarios documented.

### Phase 03 – Approval (Legacy Layout)
- [x] Comprehensive assets and guides.
- [ ] Migration into `phases/03-approval/` structure.
- [ ] Alignment with JSON source once migrated.

### Phases 04–05
- [ ] Detailed documentation, schema, and workflow coverage.

## Implementation Priorities
1. Finish Foundations verification artefacts and activate the scope handoff workflow plan.
2. Capture Timesheet Creation update/delete automation and extend verification coverage.
3. Migrate Approval docs into the `phases/` pattern so the generator can drive shared outputs.
4. Map doc updates to the shared toolbox (schema registry, helper library, UI kit) so HubSpot, Frappe, and future services reuse the same assets.
5. Backfill Billing and Notifications once Foundations/Timesheet gaps close.

## Next Steps
1. Add outstanding data points to `shared/source/phases.json` and regenerate docs (`npm --prefix config run generate:docs`).
2. Produce verification logs under `phases/<phase>/verification/logs/` after each generation run.
3. Document migration progress in each phase’s `IMPROVEMENT-PLAN.md`, cross-reference the toolbox, and update this summary when phases move to the new structure.

Use this summary to track structural work before calling the documentation initiative complete.
