# Project & Scope API Toolkit (2025-09-30)

## Objective
Build repeatable Node scripts that use the HubSpot CRM API to automate the manual workflow sequence of:
1. Creating HJ Project records from validated sales deals.
2. Assigning consultants (contacts) to projects.
3. Creating HJ Service definitions and linking them to the relevant deal/project context.
4. Generating Scope of Work (HJ Consultant) records with approved pricing.

The deliverables extend our existing timesheet/approval automation so the entire pre-timesheet setup (project → service → scope) can be driven without the legacy CMS forms.

## Source References
- `analysis/timesheet_process/phases/01-foundation/docs/DATA-ARCHITECTURE.md` – core objects, association IDs (project ↔ customer/operator/consultant).
- `analysis/process-analysis/comprehensive-process-map.md` (Project Setup & Scope sections) – confirms manual steps and linked workflows (WF-03, WF-06, WF-07–09).
- `data/curated/ai-context/custom-objects/*.json` – property inventories for HJ Projects (`2-26103074`), HJ Services (`2-26102982`), HJ Consultants (`2-26103040`).
- `data/raw/workflows/workflow-567293814-v4.json` – custom code currently creating projects and associations (used for parity).

## Deliverable Scripts (planned)
- `create-project.mjs`
- `assign-consultants-to-project.mjs`
- `create-service.mjs`
- `assign-service-to-deal.mjs`
- `create-scope-of-work.mjs`
- `collect-project-service-context.mjs`
- `collect-upstream-context.mjs`
- `seed-company.mjs`
- `seed-sales-deal.mjs`
- `seed-consultant-contact.mjs`

Each script will:
- Read an input context JSON (mirroring the pattern used by `run-approval-request.mjs`).
- Honour a `dryRun: true` flag to emit intended payloads without mutating HubSpot data.
- Call the HubSpot CRM API with proper batching/error handling when not in dry-run mode.
- Log outputs to the issue `data/` directory for audit.

## Sample Dry-Run Commands
Example contexts live under `analysis/issues/2025-09-30-project-service-api/data/` (Vital Energy baseline) and `bootstrap-context-new-customer.json` (placeholders to swap for new records). When `companyId`, `dealId`, or `contactId` are omitted in the seed payloads, the seed scripts will create the records automatically (still honouring `dryRun`).

```bash
# Collect upstream snapshot (deal + recruiting deal + contacts + companies)
node collect-upstream-context.mjs data/upstream-request.json

# Seed prerequisites (dry-run)
node seed-company.mjs data/seed-company-example.json
node seed-sales-deal.mjs data/seed-sales-deal-example.json
node seed-consultant-contact.mjs data/seed-consultant-contact-example.json

# Project/service/scope automation (dry-run)
node create-project.mjs data/create-project-context.json
node assign-consultants-to-project.mjs data/assign-consultants-context.json
node create-service.mjs data/create-service-context.json
node assign-service-to-deal.mjs data/assign-service-context.json
node create-scope-of-work.mjs data/create-scope-context.json
```

Swap `dryRun` to `false` (or remove from the JSON) when ready to apply changes to HubSpot.

### Stage Toggles & Output
- Set `stages.{stageName}` to `false` in the bootstrap context to skip any step (`seedCompany`, `seedSalesDeal`, `seedConsultant`, `createProject`, `assignConsultants`, `createService`, `assignService`, `createScope`, `collectSnapshots`).
- Each script writes its own summary JSON (e.g., `seed-sales-deal-*.json`, `project-run-*.json`). The bootstrap orchestrator aggregates the paths under `summaries` in `bootstrap-run-*.json` for quick reference.
- `cleanupTemp` controls whether generated temp context files are removed after the run.
- Company blocks can include `createContact` with `properties`, optional `contactId`, `associationTypeId`, and a `mapping` object to populate deal/scope properties (e.g., map primary contact email/name/id or approver fields). The bootstrap orchestrator reuses the generated contact IDs in later stages automatically.

### Troubleshooting
- Missing association type IDs in `seed-sales-deal` contact payloads cause skips—ensure `associationTypeId` is provided (e.g., 20 for approver, 19 for primary contact).
- The bootstrap script reuses existing projects/services when IDs are supplied; omit IDs or set `skipIfExists: false` to force creation.
- Use the upstream/project context collectors to verify HubSpot state before switching `dryRun` off.
- When validation is enabled (non-`dryRun` runs), the orchestrator checks that companies, deals, contacts, projects, services, and scopes have the expected properties and associations. Warnings surface in `bootstrap-run-*.json` under `validation` and the CLI output.

## Next Actions
- Finalise property/association maps per script (`implementation-plan.md`).
- Scaffold shared HubSpot request helper (reusable across scripts).
- Implement and dry-run against stored context snapshots before touching production data. **Sample contexts** live under `analysis/issues/2025-09-30-project-service-api/data/` (see `project-service-context-*.json` and per-script `*-context.json`).
