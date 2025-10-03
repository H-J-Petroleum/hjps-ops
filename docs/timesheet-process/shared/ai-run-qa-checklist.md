# AI Documentation Run QA Checklist

Use this checklist after every AI-native documentation cycle to confirm the deliverable is ready to merge.

## Completeness
- ✅ Required sections present (mission, responsibilities, inputs/outputs, workflows, runbooks, validation, risks, references)
- ✅ References link to real files in the repository (`analysis/`, `data/`, `scripts/`, etc.)
- ✅ Newly generated content replaces any placeholders/TODO markers

## Accuracy
- ✅ Object/property names match latest schemas in `data/raw/ai-context/ai-context-export/data-model/`
- ✅ Workflow IDs and module names align with `data/raw/workflows/` and `data/raw/themes/`
- ✅ Status or metric callouts use current timestamps from `context-index.json`

## Execution Notes
- ✅ Prompt-pack JSON archived alongside the deliverable (e.g., `prompt-pack.agent.json`)
- ✅ Run logged in `logs/documentation-run-*.json` with timestamp, phase, subprocess, actions, and notes
- ✅ `logs/agent-dashboard.html` refreshed with the context index timestamp and counts

## Validation
- ✅ Manual spot-check of two critical scenarios (happy path + failure path) against existing workflows/modules
- ✅ Lint/format check passes if code snippets were added (`npm run lint` when relevant)
- ✅ QA reviewer sign-off recorded (name/initials + date) when required

Document adherence in the run log; if any box fails, capture remediation steps before closing the task.
