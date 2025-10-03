# Approval UI & UX Recommendations

Guidance for the approval-facing interfaces based on the redesigned architecture.

## 1. Dashboard & Modules
- Implement the unified approver dashboard described in [notes/ARCHITECTURAL-REDESIGN-PLAN.md](notes/ARCHITECTURAL-REDESIGN-PLAN.md) with filter, bulk action, and history panes.
- Reuse shared UI assets (buttons, tables, toasts) once migrated into the toolbox so internal and customer views remain consistent.
- Provide real-time status updates (approved, rejected, re-submitted) without forcing portal reloads.

## 2. Accessibility & Feedback
- Add clear success/error messaging for each approval action, including escalation warnings.
- Ensure keyboard navigation works for all dashboard actions and portal buttons.
- Include explicit visibility into approver persona (HJ vs customer) and next steps after each decision.

## 3. Content & Copy
- Align terminology with the strategy hub: approvals move from Submitted → Approved/Rejected → Re-Submitted.
- Surface SLA reminders and escalation paths in-context to set expectations for consultants and internal staff.

For deeper wireframes and component notes, see [notes/ARCHITECTURAL-REDESIGN-PLAN.md](notes/ARCHITECTURAL-REDESIGN-PLAN.md).

**Related references:** [../../../docs/strategy/index.md](../../../docs/strategy/index.md).