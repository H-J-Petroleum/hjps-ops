# Known Issues – Scope Management (Foundations)

## Current Issues

### 1. Scope URL Not Regenerated After Consultant Reassignment
- Description: When consultant contact changes, WF-01 is not re-run so `scope_of_work_and_pricing` still references the previous consultant.
- Impact: New consultant cannot access the scope builder; approval request references incorrect consultant.
- Action: Re-enroll WF-01 on the recruiting deal after consultant reassignment.

### 2. Approval Form Missing Pricing Arrays
- Description: Scope Approval submissions occasionally omit pricing arrays (`sof_consultant_hourly_prices`, etc.) when consultants skip pricing steps.
- Impact: WF-09 fails to update custom object pricing or logs incorrect zero values.
- Action: Require completion of pricing steps in the `prepare-consultants-*` flow before allowing submission.

## Resolved Issues

_None logged yet._
