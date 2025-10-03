# Project Configuration Interface Specs

## Consultant Assignment Wizard
- **Components:**
  - Header block summarising deal, consultant, and required approver.
  - Stepper component (3 steps: Review Consultant, Confirm Approver, Launch Well Creation).
  - Embedded iframe for form `f1784acd-d74d-441e-b5e5-c0c4fbbf2f5e`.
- **Interactions:**
  - Buttons trigger navigation between steps and open CRM record links.
  - Error banner displays WF-03 note content when `missing_important_info` is true.

## Deal Sidebar Card (HubSpot UI Extension)
- **Fields:** Approver status, primary contact, customer/operator associations, latest WF-03 execution timestamp.
- **Actions:** Buttons to “Re-run validation” (changes stage to trigger WF-03) and “Open Consultant Wizard”.
- **State Handling:** Uses color badges (green = ready, red = blocked) based on `missing_important_info`.

## Well Creation Launch Panel
- **Source:** CMS page referenced by `create_associate_well` property.
- **Layout:** Instructional copy plus CTA buttons to open “Create Well” or “Associate Existing Wells” forms.
- **Post-submit Guidance:** Toast message prompting users to refresh the sales deal to allow WF-04/WF-05 to run.

## Validation Requirements
- All wizard steps must confirm the approver contact is unique before allowing progression.
- Sidebar card should poll for updates after WF-03 completes to reflect the latest validation state.
- Well creation panel should confirm both operator and customer associations exist before enabling CTAs.

## UX Notes
- Keep navigation accessible (keyboard support, focus states) within the wizard.
- Provide inline help links to documentation (`analysis/timesheet_process/phases/01-foundation/overview.md`).
- Ensure mobile view collapses steps into accordion to maintain readability.

_Last updated: 2025-09-18._

