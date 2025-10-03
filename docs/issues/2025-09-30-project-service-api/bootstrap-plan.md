# Bootstrap Script Strategy

Goal: provide a single entry point (`bootstrap-project-suite.mjs`) that orchestrates all upstream seeding plus project/service/scope creation.

## Proposed flow
1. **Load master context JSON** containing:
   - Company payload (customer + operator)
   - Sales deal payload (properties + association IDs)
   - Consultant contact payload + recruiting deal link
   - Project/service/scope definitions
2. **Execute stages sequentially** (each honouring `dryRun`):
   1. `seed-company.mjs` for customer, then operator (skip if IDs match).
   2. `seed-sales-deal.mjs` to ensure deal properties + associations.
   3. `seed-consultant-contact.mjs` to prep the consultant + recruiting deal link.
   4. `create-project.mjs` (with `skipIfExists` guard) and resulting associations.
   5. `assign-consultants-to-project.mjs` to attach the prepared contact.
   6. `create-service.mjs` & `assign-service-to-deal.mjs` for catalog entries.
   7. `create-scope-of-work.mjs` to persist pricing/approval context.
3. **Run validation snapshots**
   - After each major stage, call `collect-upstream-context.mjs` or `collect-project-service-context.mjs` to capture state for audit.
4. **Output summary**
   - Single JSON log capturing each step, responses, and any IDs created (mirrors existing run summary files).

## Next Steps
- Define master context schema (nested objects for company/deal/contact/project/service/scope).
- Implement orchestrator with per-step toggles (`runStages: ['seedCompany', 'project', ...]`).
- Add retry/error handling wrapper to allow resume without re-running completed stages.
- Update README with bootstrap usage once implemented.
