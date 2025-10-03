# AI Agent Guidance Hub

Use this hub to coordinate AI-driven documentation updates now that the timesheet repository is organised around a shared source of truth.

## Structure at a Glance
- **Shared assets:** `analysis/timesheet_process/shared/` (templates, source data, verification helpers, AI orchestration scripts).
- **Phase deliverables:** `analysis/timesheet_process/phases/<phase>/` with `docs/`, `verification/`, and `agents/` subfolders.
- **Source of truth:** `analysis/timesheet_process/shared/source/phases.json` captures workflows, forms, associations, and status notes for every phase.

## Working Model
1. Update phase metadata in `shared/source/phases.json` (or supporting data extracts) instead of editing Markdown directly.
2. Run `npm --prefix config run generate:docs` to regenerate `STATUS.md`, `TRACE.md`, and other rendered artefacts.
3. Review the diff and regenerate verification logs with `python3 analysis/timesheet_process/shared/verification/verify_phase.py --phase <phase>` as needed.
4. When agent-specific guidance changes, refresh the relevant templates under `shared/templates/` and regenerate prompt packs if automation relies on them.

## Helpful Resources
- `shared/templates/agent-guide-template.md` – scaffold for agent guides.
- `shared/templates/status-template.md` / `trace-template.md` – placeholder templates for future expansion of the generator.
- `shared/process/README.md` – explains the documentation pipeline and QA expectations.
- `shared/agent-quick-start.md` – operational cheat sheet for running agents, generators, and verification.

Keep all AI instructions aligned with the shared JSON source and generator outputs. If you need a new data point, add it to `phases.json`, extend the generator, and document the change in the phase improvement plan.