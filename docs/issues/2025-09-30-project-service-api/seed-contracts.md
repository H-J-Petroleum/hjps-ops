# Seed Contracts (Upstream Objects)

Defines the minimum properties/associations we need on existing HubSpot records before running the project/service/scope automation. These values let the downstream scripts operate without manual HubSpot edits.

## 1. H&J Sales Pipeline Deal (0-3)
- **Associations**
  - Customer company labelled `Customer` (typeId 207/208).
  - Operator company labelled `Operator` (typeId 205/206).
  - Approver contact (label `Approver`) with email & name populated.
  - Optional: primary customer contact label if separate from approver.
- **Required properties**
  - `dealname`
  - `hubspot_owner_id`, `owner_name`, `owner_email`, `owner_contact_id`
  - `hj_customer_name`, `hj_customer_id`
  - `hj_operator_name`, `hj_operator_id`
  - `hj_primary_customer_contact_name`, `hj_primary_contact_email`, `hj_primary_customer_contact_id`
  - `approver_full_name`, `approver_contact_email`, `approver_unique_id`, `hj_approver_is`
  - `terms`, `taxable`, `class`
  - Optional but recommended: `project_object_id`, `project_unique_id` if project already exists.

## 2. Consultant Contact & Recruiting Deal
- **Contact (0-1)**
  - `firstname`, `lastname`, `email`, `phone`
  - `submitted_as_timesheet_contact` (Yes/No)
  - `main_contact_id`, `main_contact_email` (when delegate submits on behalf of consultant)
  - Optional: compliance/role fields (discipline, certifications)
- **Recruiting Deal (pipeline 8926629)**
  - `consultant_full_name`, `consultant_email`, `consultant_unique_id`
  - Role metadata: `consultant_role`, `consultant_title_job`
  - Pricing hints if available (hourly/daily/per-diem) to seed scopes later
  - Association to consultant contact (typeId 4 labelled `Consultant`)

## 3. Company Records (Customer & Operator)
- `name`
- `msa_terms` (billing terms mirrored onto project)
- `hj_taxable` (Yes/No)
- API/mailing data as needed for wells/scopes

## 4. Optional Supporting Objects
- **HJ Service** entries for recurring catalog items:
  - `hj_service_name`, `hj_billing_frequency`
  - Price fields (`hj_*` and `hj_hj_*` variants)
- **HJ Consultant (scope)** records (if reusing existing approvals) should already contain consultant/project IDs and pricing arrays.

These contracts align with `analysis/timesheet_process/phases/01-foundation/docs/DATA-ARCHITECTURE.md` and the Vital Energy context we captured on 2025-09-30.
