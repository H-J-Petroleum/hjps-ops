# Placement Refactor Blueprint

## New CRM Objects

- **HJ Taxonomy (hj_taxonomy)** — Governs Industry → Domain → Discipline → Role → Level tuples for recruiting, sales, and delivery.
- **HJ Compliance Catalog (hj_compliance_catalog)** — Master list of compliance requirements, costs, lead times, and waiver rules.
- **HJ Placement (hj_placement)** — Lifecycle record joining assignment, consultant person/entity, taxonomy, compliance snapshot, rates, and access tokens.
- **HJ Compliance Record (hj_compliance_record)** — Snapshot of compliance fulfillment tied to a placement.
- **HJ Placement Approver (hj_placement_approver)** — Approver configuration per placement supporting sequential and parallel routing.

Schema prototypes live in analysis/timesheet_process/phases/01-foundation/agents/data_relationships/properties/new-object-schemas.json.

## Key Associations

- hj_taxonomy ↔ PersonRoleProfiles, Openings, Placements.
- hj_placement ↔ Contact (consultant), Company (entity), Deals (recruiting & sales), Projects, Assignments, Wells/Pads, hj_services, hj_consultants, hj_timesheets, hj_approvals, ComplianceRecords, PlacementApprovers.
- hj_compliance_record ↔ Placement, ComplianceCatalog, Consultant Person/Entity.
- hj_placement_approver ↔ Placement, Approver Contact, Approval history.

## Workflow Updates

1. Recruiting (WF-01) — Create placements from recruiting deals; stop writing HTML button properties.
2. Project Validation (WF-03) — Support many projects per sales deal; populate Placement with project/operator context.
3. Consultant Assignment (WF-06) — Establish Placement, default PlacementApprovers (project/pad/well templates), and sync hj_consultants scope rows.
4. Scope Approvals (WF-09) — Update Placement rate/version, compliance status, and OpenLibre envelope metadata when scope locks.
5. OpenLibre Integration — New automation to issue signature envelopes, track status, and store signed URLs on Placement.
6. Compliance Checks — Scheduled validation against ComplianceCatalog; raise Placement alerts.
7. Timesheet Access (WF-10) — Generate tokens from Placement, surface CRM cards only.
8. Timesheet Creation (WF-11) — Pull consultant identity, rates, and allocation permissions from Placement; enforce compliance validity.
9. Approval Workflows (WF-21/26 merge) — Route based on PlacementApprover records; log outcomes back to Placement and HJ Approval objects.
10. Reporting — Shift dashboards to Placement for bench readiness, utilization, compliance expiries, and project profitability.

## Migration & Backfill

1. Seed Reference Data
   - Load Taxonomy tuples.
   - Author ComplianceCatalog entries.
   - Validate hj_services alignment with taxonomy and rate fields.

2. Backfill Placements
   - Derive placements from existing recruiting deals, projects, contacts, and hj_consultants scope rows.
   - Create initial ComplianceRecords where documentation exists; flag unknown items.
   - Seed PlacementApprover defaults from current project approver properties.

3. Shadow Mode
   - Dual-write workflows/modules (legacy properties + new objects).
   - Validate OpenLibre integration and placement-driven portals.

4. Cutover
   - Switch portals/workflows to Placement data sources.
   - Retire deal/contact consultant properties and cg_*/quote_consultant_* arrays.
   - Update reporting artifacts.

5. Post-Cutover Monitoring
   - Observe compliance alerts, approval routing, multi-project behavior.
   - Adjust taxonomy and catalog governance processes as needed.

## Immediate Action Items

- Finalize HubSpot custom object definitions based on schema JSON.
- Build sandbox workflows for placement creation and approver defaults.
- Design migration scripts for Placement, ComplianceRecord, and PlacementApprover backfill.
- Map OpenLibre API integration (create envelope, poll status, webhook handling).
- Prepare stakeholder communication (Sales, Talent, Accounting) for new CRM cards and reporting views.
