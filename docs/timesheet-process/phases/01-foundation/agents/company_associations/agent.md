# Company Associations Agent Guide

Ensure wells and companies are correctly linked to deals so Foundations validation (WF-03) can pass and project creation can run.

## Workflow Responsibilities
| ID | Name | What to watch |
|---|---|---|
| 567358311 | 04. Associate Created Well to Sales Deal | On new well creation, associates operator and deal (types 126/128). |
| 567358566 | 05. Associate Existing Wells to Sales Deal | Processes form submissions to bulk-associate existing wells to a deal. |
| 567293814 | 03. Update Sales Deal & Create Custom Project Object | Depends on the associations above; flags errors if operator/company data is missing. |

## Pre-Flight Checks
- `python3 analysis/timesheet_process/shared/context_index.py --pretty`
- Confirm workflow exports exist in `data/raw/workflows/` (rerun exporter if only partial v4 files exist).
- Verify forms and modules:
  - Forms: `b682c714-e395-4677-bbfb-1a32fad5f04b` (Create Well), `3876c3f0-6363-4958-a3be-500a64bd6431` (Associate Existing Wells)
  - Modules: `hjp-create-associate-well.module`, `hjp-created-well.module`
- Review `foundations-build-notes.md` for outstanding issues.

## Inputs & Outputs
- **Inputs:** HJ Wells objects (`hj_well_operator_id`, `hj_well_deal_id`), contact records with well arrays, sales deals awaiting Closed Won.
- **Outputs:** Association type 126 (Company ↔ Well) and type 128 (Deal ↔ Well) created; WF-03 validations satisfied.

### Critical Associations & Properties
| Item | Source | Notes |
|---|---|---|
| Association 126 | WF-04 | Operator company ↔ well. |
| Association 128 | WF-04 / WF-05 | Sales deal ↔ well. |
| `associate_existing_wells_ids_array` | WF-05 input | Comma-separated list of well IDs pulled from the contact. |
| `associate_existing_wells_sales_deal_id` | WF-05 input | Target sales deal for bulk association. |
| `hj_well_operator_id`, `hj_well_deal_id` | WF-04 input | Required on the new well record. |

### Forms & Modules
| Asset | ID / Path | Notes |
|---|---|---|
| Create Well form | `b682c714-e395-4677-bbfb-1a32fad5f04b` | Creates HJ Wells records that trigger WF-04. |
| Associate Existing Wells form | `3876c3f0-6363-4958-a3be-500a64bd6431` | Populates contact arrays consumed by WF-05. |
| `hjp-create-associate-well.module` | CMS module | UI entry point for manual well creation; must pass operator/deal IDs. |
| `hjp-created-well.module` | CMS module | Confirmation/feedback for associated wells. |

## Runbook
1. **Check WF-04 history** – ensure new wells are associating successfully (no errors in logs).
2. **Review WF-05 executions** – confirm the contact arrays are parsed and all wells get created associations.
3. **Validate in WF-03** – after wells are in place, rerun WF-03 to verify `missing_important_info` remains “No”.
4. **Update documentation/logs** – record outcomes in `logs/documentation-run-*.json`; note anything unusual in `foundations-build-notes.md`.

## Troubleshooting
- **Associations missing:** Confirm operator ID and deal ID are present on the well record; rerun WF-04.
- **Bulk association failures:** Check the contact property arrays; ensure they are comma-separated and not “none”.
- **WF-03 still failing:** Use `deal_error_note_id` to see whether operator/customer associations are still missing.

---
_Last regenerated: 2025-09-18._

