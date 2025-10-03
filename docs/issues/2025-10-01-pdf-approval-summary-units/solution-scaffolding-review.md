# Solution Scaffolding Review – PDF Approval Summary Units
_Drafted: 2025-10-01_

## Overview
We scaffolded the PDF approval output to normalize units, quantities, and currency for both service-level and well-level summaries. A reusable `ValueFormattingService` now encapsulates all formatting logic, preventing duplicated heuristics across the generator.

## Key Deliverables
- **Shared Formatting Layer**: Introduced `src/pdf-generator/src/services/valueFormattingService.js`. It derives units from the raw timesheet payload, harmonizes aliases (e.g., `Day`, `Per Diem`, `Mileage` → `days`, `mi`), formats quantities with smart precision, and centralizes USD currency rounding.
- **Formatter Integration**: `Formatters` now re-exports the helper methods so existing consumers can switch to `Formatters.formatQuantity` / `formatUnit` without knowing about the underlying service.
- **Data Processor Enhancements**:
  - `calculateServiceTotals` and `calculateWellBreakdown` maintain raw totals plus display-ready values (`quantityDisplay`, `amountDisplay`) and append unit labels to service names before rendering.
  - Detailed line items store normalized units and preformatted quantities to keep table rendering consistent.
- **Table Rendering Updates**: Service Summary and Well Breakdown headers now show `Qty`, right-align numeric columns, and rely on the preformatted values. The footer total leverages the shared currency helper to ensure `$0.00` output.
- **Approval API alignment**: `src/approval-api/src/services/pdfIntegrationService.js` now reuses the formatter to enrich outbound timesheet payloads with `unit`, `unitDisplay`, and formatted quantity/amount strings so any downstream API or CSV usage inherits the same presentation rules.

## Test Coverage
- `npm --prefix config run test:pdf` – passes with existing suites (no new specs yet).
- `npm --prefix src/approval-api test -- pdfIntegrationService` – validates the integration service emits formatted units/amounts for downstream clients.

## Follow-Up Considerations
- Add targeted unit tests for `ValueFormattingService` (mixed-unit warnings, alias coverage) and the updated data processor aggregations.
- Validate the unit heuristics against live approval payloads; extend `UNIT_ALIASES` if new patterns appear.
- Evaluate small numeric libraries (`currency.js`, `dinero.js`, `numbro`) if we need more rigorous rounding or localization beyond USD.

---
Prepared for review before full implementation sign-off.
