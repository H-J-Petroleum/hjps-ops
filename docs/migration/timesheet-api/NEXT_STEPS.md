# Migration Next Steps

1. **Baseline Repo Setup**
   - ✅ Initialised git in `/mnt/d/code/hjps-ops` and copied starter CI workflow.
   - ✅ Ported lint/test configs into `shared/config` and wired workspace scripts.

2. **Copy Runtime Packages**
   - ✅ Approval API copied into `packages/approval-api/` with updated imports and logging.
   - ✅ PDF Generator mirrored into `packages/pdf-generator/` with dependencies restored.
   - ✅ HubSpot custom code moved into `packages/hubspot-custom-code/` alongside utilities.

3. **Port CLI Scripts**
   - ✅ Core Node scripts migrated into `shared/scripts/{timesheet,approval,agent}`.
   - ☐ Add npm/bun wrappers for common script entry points.

4. **Documentation Migration**
   - ✅ Issue workspaces copied into `docs/issues/`.
   - ✅ Timesheet phase docs and standards imported under `docs/`.

5. **Testing & CI**
   - ✅ Jest suites now run locally (`npm run test`); integration-heavy tests bypassed via config.
   - ☐ Add smoke scripts for timesheet creation/approval flows (dry-run default).
   - ✅ CI workflow staged under `.github/workflows/ci.yml` (lint + tests).

6. **Cutover Plan**
   - Run parity tests against sandbox using both old and new repos.
   - Switch HubSpot webhook/API endpoints to the new deployment only after parity verified.
   - Archive legacy scripts or point them to new repo once production uses the new path.

Track progress here and update the checklist as tasks complete.
