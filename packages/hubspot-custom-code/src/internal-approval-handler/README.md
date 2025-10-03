# Internal Approval Handler (WF-26)

Custom-coded HubSpot workflow action that replaces the legacy WF-26 internal approval processing pipeline.

## Structure
- index.js – entry point executed by the workflow custom code action.
- lib/ contains stateless helper modules:
  - context.js – loads approval, contact, and timesheet context (stub).
  - validation.js – validates retrieved data (stub).
  - updates.js – placeholder for approval/timesheet status updates.
  - billing.js – placeholder for invoice/bill number generation.
  - documents.js – placeholder for PDF generation/upload.
  - notifications.js – placeholder for notes/emails/tasks.
  - associations.js – placeholder for CRM association management.
  - logger.js – console logger with optional Teams alert integration.
  - telemetry.js – helper that posts alerts to a Microsoft Teams webhook (supports `messageCard` or simple `text` payloads via `TEAMS_WEBHOOK_MODE`).
- package.json – local dependency manifest (currently only axios).

## Next Steps
1. Implement context.js to fetch approval, consultant, project, and timesheet data from HubSpot.
2. Flesh out validation and update modules with real business rules.
3. Port existing WF-26 logic into the billing/documents/notifications modules.
4. Wire telemetry.js to an Ops/Accounting Teams channel for failure alerts (store URL in `TEAMS_WEBHOOK_URL`).
5. Add unit tests and integration smoke tests (node --test).

Note: For authentication the handler expects a bearer token supplied via HubSpot secret (for example, `PRIVATE_APP_TOKEN`). Update context.js once the final auth strategy is chosen.

## Sandbox Fixtures
- Run the seeding helper node scripts/sandbox-seed-approval.js --env beta after exporting BETA_SANDBOX_PRIVATE_APP_TOKEN to refresh the beta sandbox test data.
- The shared beta approval fixture is 35141636865 and lives at __tests__/fixtures/approval-35141636865-context.json.

