# Documentation Pipeline

This repository now generates phase documentation from a single JSON source of truth.

## Canonical Data
- `analysis/timesheet_process/shared/source/phases.json` stores workflows, properties, URLs, status items, and trace sections for every phase.
- Add new details here (or via helper scripts) so that all downstream docs stay consistent.

## Generation Steps
1. Edit `phases.json` (and any supporting extract scripts) to reflect the latest HubSpot exports.
2. Run `npm --prefix config run generate:docs` to render Markdown into `analysis/timesheet_process/phases/<phase>/docs/`.
3. Review the diff and update improvement plans or agent guides as required.
4. Validate with `python3 analysis/timesheet_process/shared/verification/verify_phase.py --phase <phase>` to ensure exports and docs align.

## Extending the Pipeline
- Templates live in `shared/templates/`; keep them small and reference data fields from `phases.json`.
- Update `scripts/agent-core/generate-phase-docs.js` when adding new templates or outputs.
- Log structural changes in each phase’s improvement plan and in `shared/foundations-build-notes.md` so the history stays traceable.

## Agent Workflow
- Agents work from the generated docs under `phases/<phase>/docs/` but should consult `shared/source/phases.json` for definitive metadata.
- When agent prompts require context, use `shared/prompt_pack_builder.py` which now resolves shared assets and phase paths in the new structure.

Keep this document updated whenever the generator or schema changes.