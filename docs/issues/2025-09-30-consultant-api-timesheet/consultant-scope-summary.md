# Justin Lott – HJ Consultant Scope Snapshot

_Source: `data/hj-consultants-justin-lott.json` (retrieved 2025-09-30)._

## Overview
- Total consultant records returned: 141 (one row per well × service combination).
- Relevant wells for the backlog (14 AFEs) each have **three** entries:
  1. `Construction Supervisor III` (day rate)
  2. `Mileage`
  3. `Per Diem`
- Rates are consistent across all wells:
  - **Day rate:** `daily_role_price = 990.00`
  - **Mileage:** `per_mile_price = 1.25` (with `daily_role_price = 0`)
  - **Per diem:** `daily_role_price = 75.00` (per diem stored in the daily field)
- No explicit `per_diem_price` values; workflow logic must continue using the `daily_role_price` field for per diem entries.

## Rates by Well (with AFE & Record IDs)
| Well | AFE | Construction Supervisor III (`daily_role_price`) | Mileage (`per_mile_price`) | Per Diem (`daily_role_price`) | Day Record ID | Mileage Record ID | Per Diem Record ID |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Black Bear 9TB | 3025033 | $990.00 | $1.25 / mile | $75.00 | 34378831450 | 34383436800 | 34387232382 |
| Black Bear 13TB | 3025035 | $990.00 | $1.25 / mile | $75.00 | 34375253601 | 34395544576 | 34404568363 |
| Grissom White | 3025036 | $990.00 | $1.25 / mile | $75.00 | 34383899230 | 34392794748 | 34405179781 |
| Grissom White | 3025037 | $990.00 | $1.25 / mile | $75.00 | 34392794749 | 34383436801 | 34385217538 |
| Klipspringer 3B | 3025015 | $990.00 | $1.25 / mile | $75.00 | 34393259563 | 34382971465 | 34381884481 |
| Klipspringer 4A | 3025016 | $990.00 | $1.25 / mile | $75.00 | 34380223064 | 34395544577 | 34391088241 |
| Rebecca B 4J | 3025030 | $990.00 | $1.25 / mile | $75.00 | 34394349667 | 34386924850 | 34404568364 |
| Rebecca C 5MS | 3025029 | $990.00 | $1.25 / mile | $75.00 | 34386612592 | 34377243463 | 34388005430 |
| Rebecca E 6J | 3025032 | $990.00 | $1.25 / mile | $75.00 | 34392946745 | 34381421847 | 34405796375 |
| Schwartz J 1A | 3025018 | $990.00 | $1.25 / mile | $75.00 | 34389854552 | 34379916290 | 34380955742 |
| Schwartz Q 7A | 3025023 | $990.00 | $1.25 / mile | $75.00 | 34386612594 | 34389854551 | 34383899233 |
| Woods 3A | 3024056 | $990.00 | $1.25 / mile | $75.00 | 34379140457 | 34391710827 | 34411189636 |
| Woods 4A | 3024057 | $990.00 | $1.25 / mile | $75.00 | 34380223067 | 34396930216 | 34396315548 |
| Woods 5TB | 3024058 | $990.00 | $1.25 / mile | $75.00 | 34390781853 | 34387542028 | 34392174758 |

## Implications for API Tooling
- The backlog totals match the per-day calculation: **$990 day rate + $75 per diem + 300 miles × $1.25 = $1,440/day**.
- Automation should select the correct consultant record for each well/service type when creating `hj_timesheets` entries (or provide equivalent pricing metadata if inserting directly).
- Additional wells are present in the consultant scope; ensure the tooling filters to the AFEs specified by operations when allocating costs.
