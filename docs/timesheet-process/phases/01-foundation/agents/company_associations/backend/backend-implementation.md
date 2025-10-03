# Company Associations Backend Implementation

Document the automation that associates wells to deals and operators during the Foundations phase.

## Scope
- Manage workflows that create/maintain associations between wells, companies, and deals.
- Ensure forms and CMS modules supplying well information remain synchronized with workflow expectations.
- Provide validation cues for WF-03 so project creation is not blocked.

## Key Workflows
| ID | Name | Purpose |
|---|---|---|
| 567358311 | 04. Associate Created Well to Sales Deal | Runs when a new HJ Well is created; associates operator (type 126) and deal (type 128). |
| 567358566 | 05. Associate Existing Wells to Sales Deal | Bulk-associates existing wells to a deal based on form submission arrays. |
| 567293814 | 03. Update Sales Deal & Create Custom Project Object | Relies on the associations above to validate operator/company data before creating the project object. |

## Inputs & Outputs
- **WF-04 Inputs:** `hs_object_id` (well ID), `hj_well_operator_id`, `hj_well_deal_id`
- **WF-05 Inputs:** `associate_existing_wells_sales_deal_id`, `associate_existing_wells_ids_array`
- **Outputs:**
  - Association type 126 (Company ↔ Well)
  - Association type 128 (Deal ↔ Well)
  - Updated well/deal readiness for WF-03 validation

## Forms & Modules
| Asset | ID / Path | Data Provided |
|---|---|---|
| Create Well form | `b682c714-e395-4677-bbfb-1a32fad5f04b` | Captures operator/deal context; creates HJ Wells records that feed WF-04. |
| Associate Existing Wells form | `3876c3f0-6363-4958-a3be-500a64bd6431` | Sets `associate_existing_wells_sales_deal_id` and `associate_existing_wells_ids_array` on the contact for WF-05. |
| `hjp-create-associate-well.module` | CMS module | Builds the payload used by WF-04; ensure URL parameters match workflow expectations. |
| `hjp-created-well.module` | CMS module | Displays confirmation after associations are created. |

## Operational Checklist
1. Confirm workflow JSON exports are current (`data/raw/workflows/v4-flow-567358311.json`, `v4-flow-567358566.json`).
2. Validate forms exist and collect expected properties (contact/ddeal IDs).
3. Run through a well creation/association test to ensure both association types are produced.
4. Check WF-03 logs to verify operator/company validation passes.
5. Log actions in `logs/documentation-run-*.json` and update `foundations-build-notes.md` with observations.

## Troubleshooting
- **Operator not linked:** Ensure `hj_well_operator_id` is captured during well creation; re-run WF-04.
- **Bulk association skipped wells:** Inspect the array property for formatting; rerun WF-05 if needed.
- **Project creation still blocked:** Check WF-03 `deal_error_note_id` to confirm whether the operator/company data is the issue.

_Last reviewed: context index 2025-09-18._
