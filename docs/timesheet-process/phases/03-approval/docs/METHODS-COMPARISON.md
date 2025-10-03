# Approval Methods Comparison

A quick reference comparing the legacy approval implementation with the redesigned approach described in the redesign and migration notes.

## 1. Architecture Snapshot
| Area | Legacy Approach | Redesigned Approach |
| --- | --- | --- |
| Request Intake | Form submission ➜ contact property staging ➜ multiple workflows | Portal submits directly to HJ Approvals with validation and shared helper library. |
| Decision Handling | Separate customer/internal workflows with duplicated logic | Shared workflow helpers plus unified dashboard writing directly to approval + timesheet objects. |
| Reminders & Escalation | Basic reminder workflows, limited audit trail | Structured cadence with escalation tracking and verification logs. |
| Data Sync | Comma-separated arrays and inconsistent association writes | Structured associations and status fields aligned with Phase 01 + Phase 02 schemas. |

## 2. Implementation Guides
- Redesign principles and UI flows: [notes/ARCHITECTURAL-REDESIGN-PLAN.md](notes/ARCHITECTURAL-REDESIGN-PLAN.md).
- Backend schemas and validation routines: [notes/BACKEND-IMPLEMENTATION-PLAN.md](notes/BACKEND-IMPLEMENTATION-PLAN.md) and [notes/TECHNICAL-SPECIFICATION.md](notes/TECHNICAL-SPECIFICATION.md).
- Cutover sequencing: [notes/MIGRATION-STRATEGY.md](notes/MIGRATION-STRATEGY.md).

**Related references:** [../../../docs/strategy/index.md](../../../docs/strategy/index.md).