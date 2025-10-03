# Approver Assignment Backend Implementation

Keep the deal-stage validation rules healthy so every project has an approver before creation.

## Scope
- Maintain the association checks in WF-03 that require an approver contact.
- Ensure consultant assignment (WF-06) doesn’t collide with approver rules.
- Monitor conflict-check logic (approver ≠ consultant/primary contact).

## Key Workflows
| ID | Name | Purpose |
|---|---|---|
| 567293814 | 03. Update Sales Deal & Create Custom Project Object | Validation gate for approver label + conflict checks; sets `missing_important_info`. |
| 567275018 | 01. Update Recruiting Deal | Generates consultant metadata/URLs; consultant cannot also be approver. |
| 567363849 | 06. Associate Consultant to a New Sales Deal | On assignment form submit, creates association type 4 and updates contact full name. |

## Validation Logic (WF-03)
- Approver contact must be associated with label **Approver**.
- Conflict checks throw errors when approver and consultant are the same person, or when the primary contact conflicts.
- `missing_important_info` toggles to “Yes” and the deal restages if validation fails.
- `deal_error_note_id` created for operators to review.

## Data Points to Monitor
| Property | Source | Notes |
|---|---|---|
| `missing_important_info` | WF-03 action 1 | True when any prerequisite (approver label, MSA terms, etc.) fails. |
| `deal_error_note_id` | WF-03 action 1 | HubSpot note with the specific missing/conflicting association. |
| Assignment form (`f1784acd-d74d-441e-b5e5-c0c4fbbf2f5e`) | WF-06 enrollment | Must fire so the consultant association exists. |
| Association type 4 | WF-06 action 2 | Ensure consultant association is created without using the approver contact. |

## Operational Steps
1. **Export check** – confirm workflow JSON (`data/raw/workflows/workflow-03-567293814-v4.json`, `workflow-06-567363849-v4.json`) is up to date.
2. **Validate labels** – confirm CRM association labels (“Approver”) match what WF-03 expects.
3. **Audit errors** – use `deal_error_note_id` to inspect issues when deals fall out of Closed Won.
4. **Re-enroll deals** – after fixes, rerun WF-03 to verify `missing_important_info` stays “No”.
5. **Log updates** – record successful validations in `logs/documentation-run-*.json` and update `foundations-build-notes.md` if new findings arise.

## Troubleshooting
- **Approver missing:** Add the contact association with label **Approver** and re-enroll WF-03.
- **Approver conflicts:** Adjust associations so the approver differs from consultant and primary contact before re-running WF-03.
- **Workflow not re-running:** Ensure the re-enrollment triggers (stage change) fire; otherwise, manually trigger via HubSpot.

_Last reviewed: context index 2025-09-18._
