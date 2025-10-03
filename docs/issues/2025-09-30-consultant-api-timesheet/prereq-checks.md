# Prerequisite Checks: Consultant + Project Context (WF-01 & WF-03 Alignment)

This checklist maps the data validation we need before inserting timesheet records through the API. It draws directly from the comprehensive process map (`analysis/process-analysis/comprehensive-process-map.md`) so the automation respects all upstream governance.

## 1. Consultant Recruiting Deal (WF-01: Update Recruiting Deal, ID 567275018)
- **Pipeline:** Recruiting (`8926629`)
- **Required properties:** `consultant_unique_id`, `consultant_full_name`, `consultant_email`, `link_for_consultant`, `assign_consultant_to_a_new_sales_deal`, `title_job`, `test_link`, `test`.
- **Validation steps:**
  1. **Decrypt the consultant ID** from the portal link by subtracting `3522` (per WF-01 logic) to get the HubSpot contact ID (`299151` expected for Justin Lott).
  2. `POST /crm/v3/objects/deals/search` with filters:
     - `propertyName = consultant_unique_id`, `operator = EQ`, `value = 299151`
     - `properties` array should include all WF-01 outputs above.
  3. Confirm the deal lives in the Recruiting pipeline and retains an active `link_for_consultant` URL that matches the provided portal link. This ensures WF-01 completed successfully and the consultant has a valid recruiting deal record.

## 2. Sales Deal + Project Validation (WF-03: Update Sales Deal and Create Project Object, ID 567293814)
- **Pipeline:** Sales (default pipeline)
- **Key properties:** `hj_customer_id`, `hj_customer_name`, `hj_operator_id`, `hj_operator_name`, `owner_email`, `create_associate_well`, `terms`, `taxable`, `missing_important_info`.
- **Validation steps:**
  1. Locate the sales deal associated with the project ID `hjp-15911-37197` via `POST /crm/v3/objects/deals/search` filtering by custom property `hj_project_id` or related association (if needed, fetch from the custom project object `2-26103074`).
  2. Ensure `missing_important_info = No` which means WF-03 validations passed (see process map section “Critical Validation Logic”).
  3. Check the `create_associate_well` property exists (non-empty URL) indicating the operator wells were provisioned via the CMS module.
  4. Capture `owner_email`, `hj_customer_*`, `hj_operator_*`, and billing terms. These values populate the timesheet context fields WF-11 expects.

## 3. Project ↔ Well Associations (Deal ↔ Well, Association Type 128)
- **Process map reference:** association logic under “Complete well creation to consultant assignment flow”.
- **Validation steps:**
  1. Use `GET /crm/v4/objects/deal/{dealId}/associations/2-26102958` with `limit=100` to pull well associations (associationTypeId `128`).
  2. Confirm the response returns the 14 well IDs listed in the allocation table. Any missing wells must be associated before time can be allocated.
  3. Optionally verify each well (`2-26102958` object) remains active (`hj_well_is_active = Yes`) and belongs to the correct operator.

## 4. Consultant ↔ Project/Well Eligibility (HJ Consultants, ID 2-26103040)
- **Why it matters:** WF-11 reads from the `hj_consultants` custom object to map wells, roles, and rate cards (see `analysis/timesheet_process/phases/02-timesheet-creation/docs/DATA-ARCHITECTURE.md`).
- **Validation steps:**
  1. Fetch the consultant record via `GET /crm/v3/objects/2-26103040/{id}` where `{id}` can be obtained from the recruiting deal or contact association.
  2. Confirm properties such as `consultant_deal_id`, `payment_deal_id`, `hj_project_id`, `well` (authorized wells), `hourly_role_price`, `daily_role_price`, `per_each_price`, `per_mile_price`, and per diem equivalents.
  3. Verify that the well list includes all 14 wells or that permissions logic does not restrict allocation. If wells are missing, coordinate with operations to update the consultant record before proceeding.

## 5. Custom Project Object (HJ Projects, ID 2-26103074)
- **Purpose:** Bridge between deals, consultants, and the portal.
- **Validation steps:**
  1. Retrieve the project object via `GET /crm/v3/objects/2-26103074/{id}` using the decoded project ID.
  2. Confirm associations to the sales deal, recruiting deal/consultant, and wells exist.
  3. Ensure `hj_project_is_locked = No`; if locked, timesheet submissions (manual or API) should be deferred.

## 6. Portal Link Consistency (Consultant Experience)
- **Check:** Using the values from steps 1–5, reconstruct the portal link:
  ```
  https://hjpetro-1230608.hs-sites.com/insert-timesheet-step-1?
    consultant_id={hubspotContactId + 3522}&
    consultant_email={consultant_email}&
    timesheet_contact=No&
    email_to_submit={consultant_email}&
    consultant_name={encoded full name}&
    project_id={project_id}
  ```
- If the regenerated link differs from the one provided, identify whether consultant/project properties have changed since WF-01 ran. Update the recruiting deal via WF-01 (re-enroll) or regenerate the link to keep tooling consistent.

## 7. Evidence Collection
For each check, plan to log the following in this issue folder once API access is available:
- Search payloads and truncated results (redacted for PII as required).
- Deal, consultant, project, and well IDs confirmed.
- Any discrepancies surfaced compared to the process map expectations.

> **Note:** API calls are outlined for planning purposes; actual execution requires network access and valid HubSpot private app credentials with `crm.objects.*` and `crm.associations.*` scopes. Once access is available, capture outputs here before moving on to payload design.
