# Foundations UI/UX Architecture & Recommendations

This guide inventories the key UI assets used in Phase 01 (workflows + CMS) and recommends a cohesive approach for future work.

> **Toolbox Link**: The shared `hj-foundations-ui` bundle and validation checklist live in [docs/standards/toolbox.md](../../../../docs/standards/toolbox.md). All HubSpot modules, Frappe web views, and future front ends must load those assets instead of introducing bespoke styling.

## 1. Primary User Flows

| Flow | Pages/Modules | Purpose | Notes |
| --- | --- | --- | --- |
| Consultant intake | `hjp-assign-consultant-to-new-deal-01/02/03.module` | Wizard to confirm consultant data and generate URLs | Inline JS handles navigation; styling inconsistent with newer theme components |
| Scope authoring | `prepare-consultants-start`, `prepare-consultants-01/02`, `prepare-consultants-overview` | Multistep scope builder collecting pricing arrays | Heavy inline JS/HubL, minimal validation, repeated markup |
| Scope approval | `approve-scope-of-work-01/02` modules & landing pages | Approver reviews request and submits form | Large HTML blocks, manual parameter parsing, inconsistent typography |
| Well creation | `hjp-create-associate-well`, `hjp-created-well` | Provides context and forms for well association | Simple layouts, limited reuse |
| Internal alerts (deal notes/buttons) | Workflow-generated HTML (WF-01/03/09) | Puts CTA buttons directly on deals/contacts | HTML in properties; inconsistent button styles |

## 2. UI Component Inventory

| Component | File(s) | Implementation Pattern | Issues |
| --- | --- | --- | --- |
| Navigation button (Next/Back) | `hjp-assign-consultant-*` | Inline `<button>` with JS `window.location` | No shared component; inconsistent class names |
| Pricing tables | `hjp-prepare-consultants-02.module` | Raw HTML table + JS for array handling | Accessibility gaps, manual DOM manipulation |
| Approval summary cards | `hjp-approve-scope-of-work*.module` | Custom div layout with inline styling | Hard to maintain, not theme aware |
| Form validation notices | Multiple modules | Inline JS `alert()` or silent failure | Lack of user feedback when fields missing |
| Deal/Contact CTA buttons | Workflow HTML strings | `<a>` styled as button | Style drift; not mobile friendly |

## 3. Pain Points & Themes
- **Styling fragmentation:** Modules rely on inline CSS or legacy theme classes (`hj-forms`, `hj-tables`). No shared design tokens or utility classes.
- **JavaScript duplication:** Each module hand-builds query strings, handles navigation, and performs validation; no shared JS library.
- **Accessibility risks:** Tables and forms lack proper labels, keyboard states, and error messaging.
- **Property-driven CTAs:** HTML buttons embedded in deal properties bypass CMS/theming and complicate responsive design.
- **Manual multi-step flows:** Navigation relies on `window.location` with minimal state management; no graceful fallback if parameters missing.

## 4. Recommendations

| Area | Recommendation | Benefit |
| --- | --- | --- |
| Design system | Establish a shared stylesheet or HubSpot theme partial (`hj-foundations-ui.css`) with button, card, and table components | Consistent look and feel; easier theme updates |
| JavaScript utilities | Create a shared JS file (e.g., `hj-foundations-ui.js`) to handle query parsing, validation, navigation between steps | Reduces duplication; centralizes bug fixes |
| Form validation | Introduce client-side validation helpers and inline error states (ARIA roles, messaging) | Better UX and accessibility compliance |
| CTA delivery | Replace HTML buttons in properties with CRM cards or HubSpot UI extensions | Clean, responsive UI; easier to update |
| Modularization | Break large modules (approval pages) into partials or HubDB-powered sections | Improves maintainability and version control |
| Documentation | Add Figma/HubSpot theme docs for layout, spacing, and typography used in Foundations | Keeps agents aligned with design choices |
| Toolbox governance | Document UI changes in the shared toolkit and verify reuse in HubSpot + Frappe | Prevents divergence and custom "lego" components |

## 5. Integration with AI Agent Instructions
- Before modifying CMS modules or generating UI code, review this document to align with the shared patterns (component usage, JS helpers, accessibility requirements).
- Flag any new inline HTML/JS that diverges from the recommended utilities as tech debt.
- When scripting workflow-generated HTML (buttons, notes), use the shared component snippets once established.

## 6. Follow-up Tasks
- Create initial shared CSS/JS assets (tracked in repo) and update scope/approval modules to consume them.
- Define UI testing checklist (contrast, keyboard navigation, responsive behavior) for Foundations flows.
- Document CRM card/extension approach to replace HTML buttons on deals/contacts.

> Update: Load the shared UI bundle (Timesheets-Theme/shared/hj-foundations-ui.css and Timesheets-Theme/shared/hj-foundations-ui.js) via @hubspot/Timesheets-Theme/shared/partials/require-shared-assets.html before adding module-specific styles.
