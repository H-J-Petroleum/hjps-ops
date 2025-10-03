# Approval Improvement Plan

This plan consolidates the outstanding technical, operational, and documentation work needed to harden the Phase 03 approval flow.

## 1. Immediate Priorities
- Finalise workflow validation for request intake (WF-567500453), internal decision (WF-1682422902), and external decision (WF-1680618036).
- Capture reminder cadence evidence for WF-567466561 and WF-567463273 inside verification logs.
- Update screenshots and user walkthroughs for the internal vs. customer decision interfaces.

## 2. Hardening Actions
- Close the open items documented in [notes/hardening-points.md](notes/hardening-points.md) to stabilise escalation rules, SLA tracking, and approval retries.
- Align schema updates with Phase 01 configuration and record new properties/associations in data exports.
- Ensure billing prerequisites (response_approval_timesheet_ids_array, approval outcome flags) remain synchronised across objects before handoff to Phase 04.

## 3. Migration & Refactor Tasks
- Follow the staged rollout steps in [notes/MIGRATION-STRATEGY.md](notes/MIGRATION-STRATEGY.md) to swap legacy assets for the simplified architecture.
- Implement the sprint adjustments in [notes/sprint-plan-revision.md](notes/sprint-plan-revision.md) so development teams start from the Contact object and shared services first.
- Retire legacy approval assets once the unified dashboard from [notes/ARCHITECTURAL-REDESIGN-PLAN.md](notes/ARCHITECTURAL-REDESIGN-PLAN.md) is live.

## 4. Documentation & Validation
- Coordinate notification handoff with shared/notifications to confirm reminder cadence matches SLA.
- Keep STATUS, TRACE, and verification logs current after each workflow export.
- Backfill screenshots, payload logs, and schema diffs into the verification folder to support future regeneration.

**Related references:** [../../../docs/strategy/index.md](../../../docs/strategy/index.md).