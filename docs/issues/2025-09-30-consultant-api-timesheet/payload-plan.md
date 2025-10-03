# Timesheet API Payload Plan

## Objectives
- Backfill two weeks of time (2025-09-15→19 and 2025-09-22→26) for Justin Lott by calling the HubSpot CRM API (`crm/v3/objects/2-26173281`).
- Allocate the consultant’s $7,200 weekly cost evenly across the 14 target wells while respecting the existing pricing structure (day rate, mileage, per diem).
- Produce payloads that downstream workflows (approvals, billing) treat the same as WF-11 generated records.

## Data Sources
| Artifact | Purpose |
| --- | --- |
| `data/hj-consultant-lookup-table.json` | Maps each well/service to the correct HJ Consultant record ID and rate (Construction Supervisor III, Mileage, Per Diem). |
| `data/hj-consultants-justin-lott.json` | Full export of 141 consultant scope records (includes HJ/H&J pricing, deal links, well names). |
| `data/hj-consultant-grouped.json` | Grouped view keyed by well for quick lookups. |
| `data/prereq-validation-*.json` | Recruiting deal, project, and well association context (confirming project unlocked, deal Closed Won, wells associated). |
| `temp-fetched-module.html`, WF-11 custom code | Reveal the contact properties we must populate for billing metadata. |

## Pricing Recap
- Day rate (`Construction Supervisor III`): **$990.00** (H&J mirror: $1,100.00).
- Mileage (`Mileage` job service): **$1.25/mile** (stored as `per_mile_price`).
- Per diem (`Per Diem` job service): **$75.00** (stored in `daily_role_price`).
- Payment deal ID: **3024062** (same across records).
- Role / job service strings: `Construction Supervisor` / `Construction Supervisor III`.

## Per-Well Allocation (per week)
| Well | AFE | Day Amount | H&J Day Amount | Per Diem Amount | Mileage Amount | Day Qty | Per Diem Qty | Mileage (miles) |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Schwartz J 1A | 3025018 | $353.57 | $392.76 | $26.79 | $133.93 | 0.3571 | 0.3572 | 107.14 |
| Schwartz Q 7A | 3025023 | $353.57 | $392.76 | $26.79 | $133.93 | 0.3571 | 0.3572 | 107.14 |
| Woods 3A | 3024056 | $353.57 | $392.76 | $26.79 | $133.93 | 0.3571 | 0.3572 | 107.14 |
| Woods 4A | 3024057 | $353.57 | $392.76 | $26.79 | $133.93 | 0.3571 | 0.3572 | 107.14 |
| Woods 5TB | 3024058 | $353.57 | $392.76 | $26.79 | $133.93 | 0.3571 | 0.3572 | 107.14 |
| Klipspringer 3B | 3025015 | $353.57 | $392.76 | $26.79 | $133.93 | 0.3571 | 0.3572 | 107.14 |
| Klipspringer 4A | 3025016 | $353.57 | $392.76 | $26.79 | $133.93 | 0.3571 | 0.3572 | 107.14 |
| Rebecca C 5MS | 3025029 | $353.57 | $392.76 | $26.79 | $133.93 | 0.3571 | 0.3572 | 107.14 |
| Rebecca B 4J | 3025030 | $353.57 | $392.76 | $26.79 | $133.93 | 0.3571 | 0.3572 | 107.14 |
| Rebecca E 6J | 3025032 | $353.57 | $392.76 | $26.79 | $133.93 | 0.3571 | 0.3572 | 107.14 |
| Black Bear 9TB | 3025033 | $353.57 | $392.76 | $26.79 | $133.93 | 0.3571 | 0.3572 | 107.14 |
| Black Bear 13TB | 3025035 | $353.57 | $392.76 | $26.79 | $133.93 | 0.3571 | 0.3572 | 107.14 |
| Grissom White 3025036 | 3025036 | $353.57 | $392.76 | $26.79 | $133.93 | 0.3571 | 0.3572 | 107.14 |
| Grissom White 3025037 | 3025037 | $353.59 | $392.78 | $26.73 | $133.91 | 0.3572 | 0.3564 | 107.13 |

> The final well absorbs rounding remainders so totals equal **$7,200/week**. Duplicate the table for the second week (same amounts and quantities; adjust dates).

## Required Contact Properties (from Step 3 module)
Before running WF-11, the portal form writes these values onto the consultant contact. If we backfill via API, we must either stage these on the contact or include equivalents directly in the timesheet payload:
- `cg_*` arrays: wells, roles, job services, units, quantities, start/end dates/times, ordinal numbers.
- `cg_sales_deal_id`, `cg_constant_billing_frequency`.
- `hj_terms`, `hj_taxable`, `hj_class` (from project).
- `quote_consultant_id`, `quote_consultant_name`, `quote_customer_id` (become `bill_terms`, `type`, `consultant_bill_account`).
- `submitted_as_timesheet_contact`, `main_contact_id/email` for delegation handling.

WF-11 then fetches the matching HJ Consultant records to add:
- `getWellAfe` (payment deal/AFE).
- Pricing fields (`daily_role_price`, `per_mile_price`, etc.).
- Consultant title for `bill_description`.

## Payload Structure (per line item)
WF-11 populates the following properties; our API inserts should mirror the same schema so approvals, billing exports, and clean-up routines continue to work without change:

**Project & customer context**
- `timesheet_project_id`, `timesheet_project_name`
- `timesheet_customer`, `timesheet_operator`
- `timesheet_payment_deal_id` (AFE) and `timesheet_sales_deal_id`
- `timesheet_ordinal_number` (use sequential integers to maintain uniqueness)

**Consultant & pricing**
- `timesheet_consultant_id`, `timesheet_consultant_email`, `timesheet_consultant_full_name`
- `timesheet_role`, `timesheet_job_service`
- `timesheet_billing_frequency`, `timesheet_constant_billing_frequency`
- `timesheet_well`
- `timesheet_price`, `timesheet_hj_price`
- `timesheet_quantity`
- `timesheet_total_price`, `timesheet_hj_total_price`

**Schedule**
- `timesheet_start_date`, `timesheet_end_date`
- `timesheet_start_time`, `timesheet_end_time` (WF-11 copies the portal values; default to `00:00` if none provided)

**Billing metadata**
- `terms`, `terms__number_format_`
- `taxable`, `class`
- `bill_terms`, `type`, `consultant_bill_account`
- `bill_account`
- `bill_description`
- `line_item_description`

**Status**
- `timesheet_approval_status` = `Created`
- (Post-insert) `timesheet_unique_id = {projectId}-{objectId}`

## Example Line (Week of 2025-09-15 – Black Bear 9TB Day Rate)
```json
{
  "properties": {
    "timesheet_project_id": "hjp-15911-37197",
    "timesheet_project_name": "Vital - Drilling Construction Supervisor (Charlie Replacement)",
    "timesheet_customer": "Vital Energy",
    "timesheet_operator": "Vital Energy",
    "timesheet_payment_deal_id": "3025033",
    "timesheet_sales_deal_id": "16647461296",
    "timesheet_ordinal_number": "1",
    "timesheet_consultant_id": "299151",
    "timesheet_consultant_email": "justin.e.lott@gmail.com",
    "timesheet_consultant_full_name": "Justin Lott",
    "timesheet_role": "Construction Supervisor",
    "timesheet_job_service": "Construction Supervisor III",
    "timesheet_billing_frequency": "Day",
    "timesheet_constant_billing_frequency": "Day",
    "timesheet_well": "BLACK BEAR STATE A 9TB",
    "timesheet_price": "990",
    "timesheet_hj_price": "1100",
    "timesheet_quantity": "0.3571",
    "timesheet_total_price": "353.57",
    "timesheet_hj_total_price": "392.76",
    "timesheet_start_date": "2025-09-15",
    "timesheet_end_date": "2025-09-19",
    "timesheet_start_time": "00:00",
    "timesheet_end_time": "00:00",
    "terms": "Net 30",
    "terms__number_format_": "30",
    "taxable": "N",
    "class": "Vital Energy",
    "bill_terms": "3025033",
    "type": "Category Details",
    "consultant_bill_account": "Vital Energy",
    "bill_account": "Payroll Expenses",
    "bill_description": "2025-09-15\nH&J Petroleum Management & Consulting\nWell: BLACK BEAR STATE A 9TB\nConstruction Supervisor",
    "line_item_description": "2025-09-15: BLACK BEAR STATE A 9TB, 3025033; Construction Supervisor, See approved timesheet for additional information.",
    "timesheet_approval_status": "Created"
  }
}
```

Adjust `bill_terms`, `type`, `consultant_bill_account`, and dates using the values staged on the contact or sourced from existing contact records.

Mileage and per diem lines follow the same pattern with appropriate quantities/prices.

## Batch Submission
- Endpoint: `POST /crm/v3/objects/2-26173281/batch/create`
- Submit ≤100 records per call (14 wells × 3 services × 2 weeks = 84).
- Store response IDs for reconciliation and approval array updates.

## Validation & Post-Insert Steps
1. Confirm records show `timesheet_approval_status = Created` and correct totals.
2. Update or rebuild `approval_timesheet_ids_array` on the consultant contact.
3. Verify billing description and ledger fields render properly in downstream reports.
4. Document created IDs and API responses in the issue folder.

## Outstanding Checks
- Ensure the contact still holds current `quote_*`, `hj_*`, and `cg_*` properties (or replicate their values in the payload) so billing and audit fields remain accurate.
- Confirm `bill_description` string format matches existing records (date string, line breaks, consultant title from `consultant_title_job`).
- Set `timesheet_start_time` / `timesheet_end_time` consistently (portal typically uses midnight unless split-shift data exists).
- After insertion, update `timesheet_unique_id` (`{projectId}-{objectId}`) or run a follow-up batch update mirroring WF-11’s behaviour.
