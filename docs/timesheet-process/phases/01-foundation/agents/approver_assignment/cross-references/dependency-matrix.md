# Cross-References – Approver Assignment

## Upstream Dependencies
- **Recruiting Pipeline Data (WF-01):** Consultant metadata and URLs must exist before approver validation runs; missing values indicate WF-01 failed or the recruiting deal is out of sync.
- **CRM Association Labels:** HubSpot must retain the custom labels **Approver**, **Primary**, and **Consultant**; label edits break WF-03 validation logic.

## Downstream Dependencies
- **Project Configuration:** WF-03 writes customer/operator properties consumed by the project creation workflow. Failed approver checks halt project creation entirely.
- **Approval Phase (phases/03-approval):** Approver contact details feed notification templates and routing logic; inaccurate data propagates to approval emails.

## Integration Points
- **WF-03 ↔ Project Creation Workflow:** Only when approver validation passes does the project object creation trigger fire. Monitor `missing_important_info` to confirm the hand-off succeeded.
- **Consultant Assignment Modules:** URLs generated in WF-01 populate the CMS modules (`hjp-assign-consultant-to-new-deal-*`). When module parameters change, re-run WF-01 to refresh tokens before testing WF-03.

_Last updated: 2025-09-18._
