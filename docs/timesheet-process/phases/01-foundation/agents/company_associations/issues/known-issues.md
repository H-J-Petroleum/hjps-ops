# Known Issues – Company Associations (Foundations)

## Current Issues

### 1. Missing Operator ID on Newly Created Wells
- Description: Create Well form submissions occasionally omit hj_well_operator_id, causing WF-04 to skip company association.
- Impact: Project configuration reports wells without operators; billing cannot determine customer of record.
- Status: Open
- Resolution: Update Create Well form to enforce operator selection; rerun WF-04 after correction.

### 2. Associate Existing Wells Form Leaving Empty ID Array
- Description: Contacts submit the Associate Existing Wells form without selecting wells, leaving associate_existing_wells_ids_array blank.
- Impact: WF-05 executes but creates no associations, misleading operators into thinking wells were attached.
- Status: Open
- Resolution: Add validation to the form and module to require at least one well ID before submission.

## Resolved Issues

_None logged yet._

Last updated: 2025-09-18
