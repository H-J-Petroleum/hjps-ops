# Cross-References – Company Associations

## Upstream Dependencies
- WF-03 Outputs: requires customer/operator IDs and the create_associate_well URL generated during project configuration.
- Well Object Schema: hj_well_operator_id and hj_well_deal_id fields must exist; monitored via the context extract.

## Downstream Dependencies
- Project Creation: needs wells linked to the deal so approval routing can reference well metadata.
- Billing Automation: invoice workflows rely on accurate well ↔ deal associations for rate calculation.

## Integration Points
- WF-04 ↔ CMS Modules: form submissions populate hidden fields that WF-04 expects; keep module field tokens in sync.
- WF-05 ↔ Contact Properties: uses associate_existing_wells_ids_array and associate_existing_wells_sales_deal_id written by the Associate Existing Wells form.

Last updated: 2025-09-18
