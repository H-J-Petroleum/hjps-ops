# Context Index Helper

This helper pairs with Cursor + Codex CLI to surface every asset the AI loop needs without digging through folders.

## Run It
- `wsl python3 analysis/timesheet_process/shared/context_index.py --pretty`
- Optional: `--output <path>` to send JSON elsewhere.

## Output Snapshot
- `generated_at`: timestamp for traceability
- `phases[]`: each process directory with file counts and last updates
- `shared_assets.highlights`: quick access to Python/Pwsh tools and guides
- `data_sources`: HubSpot schemas, workflows, forms, modules
- `key_documents`: the high-value planning files

The script writes `context-index.json` alongside itself for other automations to consume.

## Prompt Pack Builder
- `python3 analysis/timesheet_process/shared/prompt_pack_builder.py <phase> <subprocess> <deliverable> --pretty`
- Example (pilot loop): `python3 analysis/timesheet_process/shared/prompt_pack_builder.py 01_foundation project_configuration agent --pretty`
- Deliverable keys available now: `agent`, `implementation_guide`
- Outputs land beside the target docs (e.g., `prompt-pack.agent.json`) and follow `prompt-pack-schema.json`

### Prompt Flow Usage
1. Export fresh data if needed using `scripts/hubspot/node/context/generate-ai-context.*` or `scripts/hubspot/powershell/api/*`.
2. Run the context index helper to refresh `context-index.json` (via Cursor terminal or Codex CLI).
3. Generate prompt packs for the deliverables you plan to update; paste the resulting `prompt.prompt` fields directly into Cursor chat.
4. Capture AI responses back into the referenced files (e.g., `agent.md`, `backend/implementation-guide.md`).
5. Log outcomes in `logs/` (CSV/JSON/dashboard) so the control plane reflects progress.

## Change Detection & Dashboards
- Compare successive index files to spot new/changed assets before skimming prompts.
- Feed summary counts (per phase, per asset type) into `logs/agent-dashboard.html` so the UI reflects real coverage.
- Append execution traces to a shared log (JSONL) for replay or audits.

## Upcoming Tasks
- Add optional `--phase`/`--subprocess` filters plus change logs when batch-processing docs.
- Extend prompt templates (overview, property mapping, QA review) once the loop stabilizes.
- Integrate the builder outputs with dashboard updates so trace entries surface automatically.

