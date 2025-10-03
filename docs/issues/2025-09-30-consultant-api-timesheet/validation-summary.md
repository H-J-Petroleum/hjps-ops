# Prerequisite Validation Summary (2025-09-30)

- **Token source:** HS_PROD_PRIVATE_APP (PowerShell SecretManagement) — pulled locally and used once for verification.
- **Script:** `analysis/issues/2025-09-30-consultant-api-timesheet/validate-prereqs.mjs`
- **Output:** `data/prereq-validation-2025-09-30T14-17-56-239Z.json`

## Recruiting Deal (WF-01)
- Deal `13341510837` in Recruiting pipeline (`8926629`), stage `30861861`.
- Consultant metadata aligns with portal link:
  - `consultant_unique_id = 299151` (matches decrypted ID).
  - `link_for_consultant`/`assign_consultant_to_a_new_sales_deal` URLs intact, pointing to the encrypted ID `302673` and consultant email `justin.e.lott@gmail.com`.
- Pricing placeholders (`test`, `test_link`) retain expected values (`Category Details`, `3`).

## Project & Sales Deal (WF-03)
- Project custom object `12768502194` found for `hjp-15911-37197`.
  - `hj_project_is_locked` is unset (treated as unlocked).
  - Approver email and sales owner email present (`t***@vitalenergy.com`, `j***@hjpetro.com`).
- Project → sales deal association returns deal `16647461296` (Closed Won, `missing_important_info = No`).
  - `create_associate_well` button present with Vital Energy context.
  - Customer/operator IDs align (`12006423589`).

## Wells (Deal ↔ Well 128)
- Pulled 70+ associated wells; includes all 14 target AFEs:
  - Schwartz J 1A (3025018), Schwartz Q 7A (3025023), Woods 3A (3024056), Woods 4A (3024057), Woods 5TB (3024058), Klipspringer 3B (3025015), Klipspringer 4A (3025016), Rebecca C 5MS (3025029), Rebecca B 4J (3025030), Rebecca E 6J (3025032), Black Bear 9TB (3025033), Black Bear 13TB (3025035), Grissom White 3025036, Grissom White 3025037.
- Extra wells appear as well; automation must filter to the 14 requested.

## Consultant Record (HJ Consultants)
- Custom object `24198689425` linked to recruiting deal `13341510837`, payment deal `3024062`, and sales deal `16647461296`.
- Pricing snapshot (see `data/hj-consultant-24198689425.json`):
  - `daily_role_price = 990.00` (billing frequency `Day`).
  - H&J margin reference: `hj_hj_daily_price = 1100.00`.
  - `per_mile_price`, `per_each_price`, `fee_one_time_price`, and hourly rate fields all `0.00` — no stored per diem or mileage surcharge in this record.
- Scope metadata: `hjc_role = Category Details`, `scope_of_work_approval_comment = "none"`.
- `well` property lists `DC UL Army South B 3B`; allocation across additional wells must rely on deal associations rather than this field alone.
- Full scope listings (141 total records, including all mileage/per diem variants) captured in `data/hj-consultants-justin-lott.json` and summarized in `consultant-scope-summary.md` — confirms the $990 / $75 / $1.25 pricing pattern for each target well.

## Next Validation Steps
1. Determine the authoritative source for per diem and mileage pricing (likely additional properties or related records) to reconcile the $7,200/week total.
2. Confirm whether consultant well access should be enforced via the HJ Consultants object or solely via deal associations.
3. Use the JSON output to script automated filtering of the 14 AFEs when building payloads.
