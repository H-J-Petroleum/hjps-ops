# Consultant API Timesheet Backfill (2025-09-30)

## Scenario Overview
- **Consultant:** Justin Lott (`justin.e.lott@gmail.com`)
- **Encrypted portal link:** `https://hjpetro-1230608.hs-sites.com/insert-timesheet-step-1?consultant_id=302673&consultant_email=justin.e.lott@gmail.com&timesheet_contact=No&email_to_submit=justin.e.lott@gmail.com&consultant_name=Justin%20Lott&project_id=hjp-15911-37197`
  - The link's `consultant_id` is offset by +3522 per workflow export (`workflow-567275018-v4.json`), so the underlying HubSpot contact ID is expected to be `299151`.
- **Project:** `hjp-15911-37197` (timesheet portal entry step).
- **Timeframe:**
  - Week of 2025-09-15 through 2025-09-19 (5 working days).
  - Week of 2025-09-22 through 2025-09-26 (5 working days).
- **Daily inputs:** 300 miles, 1 per diem, 1 day rate.
- **Weekly totals:** $7,200 per week, $14,400 across both weeks.
- **Wells to allocate equally:**
  1. Schwartz J 1A — 3025018
  2. Schwartz Q 7A — 3025023
  3. Woods 3A — 3024056
  4. Woods 4A — 3024057
  5. Woods 5TB — 3024058
  6. Klipspringer 3B — 3025015
  7. Klipspringer 4A — 3025016
  8. Rebecca C 5MS — 3025029
  9. Rebecca B 4J — 3025030
  10. Rebecca E 6J — 3025032
  11. Black Bear 9TB — 3025033
  12. Black Bear 13TB — 3025035
  13. Grissom White — 3025036
  14. Grissom White — 3025037

## Allocation Breakdown
Equal distribution per week requires converting $7,200 into 14 well allocations, rounding to two decimals. Using standard cent-flooring with the final record absorbing the remainder keeps totals aligned with the workflow calculation patterns (`workflow-567497868-v4.json`).

| Well | ID | Week of 09/15 Share | Week of 09/22 Share | Combined Total |
| --- | --- | --- | --- | --- |
| Schwartz J 1A | 3025018 | $514.28 | $514.28 | $1,028.56 |
| Schwartz Q 7A | 3025023 | $514.28 | $514.28 | $1,028.56 |
| Woods 3A | 3024056 | $514.28 | $514.28 | $1,028.56 |
| Woods 4A | 3024057 | $514.28 | $514.28 | $1,028.56 |
| Woods 5TB | 3024058 | $514.28 | $514.28 | $1,028.56 |
| Klipspringer 3B | 3025015 | $514.28 | $514.28 | $1,028.56 |
| Klipspringer 4A | 3025016 | $514.28 | $514.28 | $1,028.56 |
| Rebecca C 5MS | 3025029 | $514.28 | $514.28 | $1,028.56 |
| Rebecca B 4J | 3025030 | $514.28 | $514.28 | $1,028.56 |
| Rebecca E 6J | 3025032 | $514.28 | $514.28 | $1,028.56 |
| Black Bear 9TB | 3025033 | $514.28 | $514.28 | $1,028.56 |
| Black Bear 13TB | 3025035 | $514.28 | $514.28 | $1,028.56 |
| Grissom White | 3025036 | $514.28 | $514.28 | $1,028.56 |
| Grissom White | 3025037 | $514.36 | $514.36 | $1,028.72 |
| **Totals** |  | **$7,200.00** | **$7,200.00** | **$14,400.00** |

> Rounding note: Thirteen wells receive $514.28 weekly; the final well absorbs the eight-cent remainder each week to preserve exact totals without introducing fractions of a cent.

## Implementation Considerations
- Phase 02 data architecture (`analysis/timesheet_process/phases/02-timesheet-creation/docs/DATA-ARCHITECTURE.md`) shows that the timesheet workflow (WF-11) expects the `cg_*` arrays on the contact and converts them into `hj_timesheets` objects.
- Direct API creation would bypass WF-11, so we must supply the full property set that WF-11 normally calculates: project context, consultant identity, billing frequency, pricing, quantity, dates, and totals.
- `hj_consultants` records expose the authoritative rates (`hourly_role_price`, `daily_role_price`, mileage, per diem) that determine the correct unit prices for mileage, per diem, and day rate line items. We need to fetch these values before building payloads to avoid desync with billing exports.
- Each charge type (mileage, per diem, day rate) is currently represented as separate line items in the portal (per the step-by-step form in `docs/processes/timesheet-process-guidelines.md`). We should maintain that granularity to keep downstream PDF and approval flows consistent.
- Custom code in WF-11 (`data/raw/workflows/workflow-567497868-v4.json`) maps timesheet arrays to well IDs and calculates totals, so any API backfill must either:
  1. Populate the contact staging fields and let WF-11 run (requires re-triggering with careful throttling), or
  2. Create `hj_timesheets` objects directly and then backfill the array properties (`approval_timesheet_ids_array`) expected by approval workflows.

## Comprehensive Process Map Alignment
- The `analysis/process-analysis/comprehensive-process-map.md` blueprint establishes how recruiting (WF-01) and sales validation (WF-03) workflows provision consultant URLs, project context, and well associations before any timesheet entry occurs. Our API tooling must respect those upstream dependencies so that generated entries remain compatible with project-level governance.
- WF-03 enforces association labels and creates the `create_associate_well` URL that keeps well data synchronized. Before inserting timesheets we need to confirm the target deal/project has passed these gating checks, otherwise our automation could create records for unvalidated wells.
- WF-01 encrypts consultant IDs (+3522) when delivering portal links; decoding that offset safely is required for any generic tooling that accepts consultant-facing URLs as input.
- The map documents downstream form submissions (`hjp-create-associate-well`, `associate_existing_wells`) and their workflow triggers. Reusable tooling should include guardrails to verify that a consultant is still tied to authorized wells (association label 128) prior to submission, mirroring the manual process.
- These references will shape acceptance criteria: inputs must include validated consultant, project, and well associations from HubSpot so the API path becomes a drop-in replacement for the full portal sequence.

## Phase 01 & Phase 02 Context Highlights
- Phase 01 foundations documentation (`analysis/timesheet_process/phases/01-foundation/docs/*.md`) stresses that all URL/token generation should eventually move into shared services defined by the toolbox. While building interim tooling we should isolate encryption/decryption logic so it can be swapped for the shared service later without rewriting payload handling.
- The foundations data inventory defines association labels (e.g., Deal↔Well type 128, Consultant↔Project type 210) and cautions against introducing new comma-separated properties. Any helper scripts must reuse these associations instead of creating alternate relationship paths.
- Phase 02 data architecture reinforces that WF-10 seeds consultant contact records with project context (`hj_notify_*` fields) before WF-11 runs. When submitting via API we should either reuse those staging properties or ensure the data we inject mirrors what WF-11 expects (`cg_*`, `quote_*`, billing terms).
- Improvement plans for both phases call out replacing HTML button properties with shared UI extensions. As we design CLI/API tooling, capture outputs (e.g., preview links) in structured logs rather than new HTML snippets so future UI work can plug into the same data.

## Toolbox Standards Alignment
- All implementation work must adhere to `docs/standards/toolbox.md`, meaning:
  - Shared schema governance: any property/association references we rely on should trace back to the MariaDB registry and be documented for future synchronization with Frappe/agent services.
  - Helper/code reuse: encapsulate HubSpot URL signing, validation, and logging routines so they can migrate into the shared helper library without duplication.
  - UI/UX parity: avoid generating bespoke HTML or styling in new scripts; surface any consultant-facing elements through existing kits or structured data so the UI kit can consume them later.
  - Verification readiness: note where tests or verification hooks should slot into the toolbox’s testing strategy once the automation is wired into CI.

## Open Questions / Inputs Needed
1. Confirm the consultant's per-mile rate, per diem amount, and day rate from the `hj_consultants` record to match the $1,440/day composite total.
2. Determine whether the customer prefers ten days × fourteen wells (140 entries) or weekly aggregated entries per well and charge type. The portal typically generates one entry per day per charge.
3. Validate that project `hjp-15911-37197` still maps to the provided well list and that the wells are authorised for the consultant in `hj_consultants`.
4. Decide whether to leverage WF-11 via contact staging (safer for downstream logic) or to perform a direct `crm/v3/objects/2-26173281` insert with complete calculated fields.

## Next Steps (Draft)
1. Pull the consultant's `hj_consultants` record and associated rates via the HubSpot API.
2. Reconcile rate components with the $7,200/week total; adjust allocation logic if the math diverges from live pricing data.
3. Prototype API payloads for one well/week (all three charge types) and validate creation through the sandbox, ensuring `timesheet_approval_status` = `Created` and associations back to the consultant/project are present.
4. Automate distribution across all wells and both weeks, applying the rounding rules above.
5. Update approval arrays or trigger WF-11 to maintain alignment with approval workflows and PDF generation downstream.
