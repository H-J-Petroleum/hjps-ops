# Company Associations Workflow Documentation

## Workflow Sequence

### 04. Associate Created Well to Sales Deal (567358311)
- Trigger: New HJ Well created with hj_well_operator_id and hj_well_deal_id populated.
- Actions: Create company ↔ well association (type 126) and deal ↔ well association (type 128); send confirmation email if enabled.
- Outcome: Well linked to operator and sales deal, enabling downstream reporting.

### 05. Associate Existing Wells to Sales Deal (567358566)
- Trigger: Associate Existing Wells form submits on a contact with selected wells.
- Actions: Iterate over associate_existing_wells_ids_array to attach each well to the target deal.
- Outcome: Existing wells connected to the deal; contact arrays cleared post-processing.

## Branching Logic
- WF-05 uses branching to skip empty well ID arrays; add validation to ensure users pick at least one well.

## Error Handling
- Missing Operator ID: WF-04 logs failure; check Create Well form submission for required fields.
- Empty Well Array: WF-05 logs no-op; prompt user to re-submit with valid selections.

## Automated Validation
- Script `analysis/timesheet_process/phases/01-foundation/company_associations/tools/validate_wf04_wf05.py` confirms workflow exports contain association IDs 126/128. Last run: 2025-09-18 (pass).

Last updated: 2025-09-18

