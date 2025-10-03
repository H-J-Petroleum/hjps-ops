# Approver Assignment Workflow Documentation

## Workflow Sequence

### 01. Update Recruiting Deal (`567275018`)
- **Trigger:** Recruiting pipeline deal enters qualified stages (stage IDs 8934133, 8934134).
- **Core Actions:** Copy consultant contact details onto the deal; generate consultant and assignment portal URLs; set helper flags to prevent consultant/approver duplication.
- **Outcome:** Deal is prepared with consultant metadata so WF-03 can compare IDs when validating the approver.

### 03. Update Sales Deal & Create Custom Project Object (`567293814`)
- **Trigger:** Sales deal moves into Quote Review or Closed Won.
- **Core Actions:** Validate that approver, customer, operator, primary contact, and deal owner are set; compare approver against consultant/primary contact; write error note when conflicts occur; populate project-bound properties.
- **Outcome:** When successful, allows project creation workflow to run; when failing, resets stage and sets `missing_important_info = Yes`.

### 06. Associate Consultant to a New Sales Deal (`567363849`)
- **Trigger:** Submission of consultant assignment form (`f1784acd-d74d-441e-b5e5-c0c4fbbf2f5e`).
- **Core Actions:** Create association type 4 (deal ↔ consultant contact); sync consultant full name/title properties; invoke conflict check to ensure approver remains distinct.
- **Outcome:** Consultant association established so WF-03 can validate unique roles.

## Branching Logic

- WF-03 uses LIST_BRANCH actions to select remediation paths based on which validation fails (missing approver, missing MSA, conflicting consultant, etc.). Each branch writes a tailored error note to aid remediation.

## Error Handling

- **Approver Missing:** WF-03 resets the deal stage and logs guidance in `deal_error_note_id` instructing sales to add the approver association.
- **Approver Conflict:** WF-03 records conflict details, instructing users to assign a unique approver before re-enrolling.
- **Consultant Form without IDs:** WF-06 terminates with a validation message; rerun the form via the generated module link to repopulate hidden fields.

_Last updated: 2025-09-18._
