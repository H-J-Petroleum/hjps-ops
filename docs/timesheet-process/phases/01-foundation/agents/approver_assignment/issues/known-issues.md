# Known Issues – Approver Assignment (Foundations)

Track operational problems encountered while validating approver data on sales deals. Use these notes to troubleshoot WF-03 failures before project creation.

## Current Issues

### 1. Approver Missing When Deal Hits Quote Review
- **Description:** WF-03 resets the deal stage and sets <code>missing_important_info = "Yes"</code> because no contact with the <strong>Approver</strong> label is associated.
- **Impact:** Project creation is blocked; sales users see the deal bounce out of Closed Won and an error note is attached.
- **Detection:** Check WF-03 execution logs or the <code>deal_error_note_id</code> created on the deal record.
- **Resolution:** Add the approver contact with label <strong>Approver</strong>, re-run WF-03 (stage change or manual re-enrol), confirm the flag resets to "No".

### 2. Approver Matches Consultant or Primary Contact
- **Description:** WF-03 conflict check finds that the approver contact ID matches either the consultant association (type 4) or the primary contact.
- **Impact:** Same as issue #1 — the deal cannot remain Closed Won, and the approver fields on the project object remain empty.
- **Detection:** Error note from WF-03 specifies which contact role is conflicting.
- **Resolution:** Update the deal so the approver is a distinct contact; rerun WF-03 to clear the conflict.

### 3. Consultant Assignment Form Submitted Without Required Hidden Fields
- **Description:** Form <code>f1784acd-d74d-441e-b5e5-c0c4fbbf2f5e</code> occasionally loses <code>sales_deal_id_to_be_assigned</code> or <code>unique_project_id_from_sales_deal</code> parameters (usually when the module URLs are pasted manually).
- **Impact:** WF-06 cannot create association type 4, leaving the deal without a consultant record and breaking the approver conflict check.
- **Detection:** WF-06 execution shows missing input fields; consultant association absent on the deal.
- **Resolution:** Resubmit the form via the generated module link (ensures hidden fields populate). If URLs changed, regenerate them by re-running WF-01 on the recruiting deal.

## Resolved Issues

_None logged yet._

_Last updated: 2025-09-18._
