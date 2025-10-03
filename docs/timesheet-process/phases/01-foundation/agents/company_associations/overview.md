# Company Associations – Foundations Overview

This subprocess handles the well creation and association steps that must be complete before a deal is allowed to remain Closed Won and before project creation runs.

## Workflow Sequence
1. **WF-04 – Associate Created Well to Sales Deal (ID 567358311)**
   - Kicks in after the “Create Well” form (`b682c714-e395-4677-bbfb-1a32fad5f04b`) generates an HJ Wells record.
   - Uses `hj_well_operator_id` and `hj_well_deal_id` on the well object to create association type 126 (Company ↔ Well) and type 128 (Deal ↔ Well).
2. **WF-05 – Associate Existing Wells to Sales Deal (ID 567358566)**
   - Runs when the “Associate Existing Wells” form (`3876c3f0-6363-4958-a3be-500a64bd6431`) updates a contact.
   - Reads `associate_existing_wells_ids_array` and `associate_existing_wells_sales_deal_id`, then loops to create association type 128 for each well.
3. **WF-03 – Update Sales Deal & Create Custom Project Object (ID 567293814)**
   - Validates that deals have the necessary operator/customer associations; depends on the outputs of WF-04/WF-05 before it allows project creation to proceed.

## Success Criteria
- Wells are associated to both operator company and sales deal (association IDs 126 and 128) before the deal seeks Closed Won.
- WF-05 handles existing wells without leaving errors; arrays are processed successfully.
- WF-03 no longer flags missing operator/company information (`missing_important_info` stays “No”).

## References
- `analysis/process-analysis/comprehensive-process-map.md` (Workflows 04, 05)
- Workflow JSON: `data/raw/workflows/v4-flow-567358311.json`, `data/raw/workflows/v4-flow-567358566.json`
- CMS modules: `hjp-create-associate-well.module`, `hjp-created-well.module`
- Forms: `b682c714-e395-4677-bbfb-1a32fad5f04b`, `3876c3f0-6363-4958-a3be-500a64bd6431`

---
_Last aligned with context index: 2025-09-18._
