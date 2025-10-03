# Foundations Verification Plan

Use this plan to perform a final pass on Phase 01 before moving to Phase 02. The goal is to validate `FOUNDATIONS-TRACE.md` against the latest HubSpot exports, refresh the Timesheet Comprehensive Map, and log any discrepancies or gaps for remediation.

## 1. Objectives
1. Confirm that every workflow, property, module, and form documented in `FOUNDATIONS-TRACE.md` exists in the exported HubSpot data and matches the recorded details.
2. Update `analysis/process-analysis/comprehensive-process-map.md` with verified information (status, triggers, key properties) for Phase 01.
3. Produce a verification log capturing mismatches, missing assets, or unclear behaviour for follow-up.

## 2. Prerequisites
- Latest HubSpot exports present under `data/raw/`:
  - Workflows (`data/raw/workflows/`)
  - CMS modules/pages (`data/raw/hubspot-cms-assets/`)
  - Forms (`data/raw/hubspot-cms-api/forms/`)
  - Schema/context exports (`data/raw/ai-context/ai-context-export/`)
- Context index refreshed (`python3 analysis/timesheet_process/shared/context_index.py --pretty`).
- Verification log target: `analysis/timesheet_process/phases/01-foundation/verification/logs/foundations-verification-<timestamp>.md` (create directory if needed).

## 3. Verification Steps

### Step A – Workflow Cross-Check
1. Parse `analysis/timesheet_process/phases/01-foundation/FOUNDATIONS-TRACE.md` to list all referenced workflows (IDs + names).
2. For each workflow:
   - Confirm presence in `data/raw/workflows/` (`v4-flow-<id>.json` or equivalent).
   - Validate key attributes (trigger stages, association labels, output properties) against trace entries.
   - Log discrepancies (missing workflow file, mismatched stage IDs, missing property writes).

### Step B – Property & URL Validation
1. Gather all properties listed in the trace (deal, contact, custom objects, HJ Projects, HJ Consultants, HJ Wells).
2. Verify existence and metadata (label, type) in schema exports under `data/raw/ai-context/ai-context-export/data-model/`.
3. Spot-check workflow custom code to confirm properties are actually written when documented.
4. For URL patterns, confirm originating workflows (WF-01, WF-03, WF-09) embed matching templates.

### Step C – CMS Module & Form Audit
1. Extract module references from the trace (`prepare-consultants-*`, `hjp-approve-scope-of-work-*`, consultant intake modules).
2. Confirm corresponding files in `data/raw/hubspot-cms-assets/` and note implementation pattern (inline JS, dependencies).
3. Validate forms in `data/raw/hubspot-cms-api/forms/cms_forms_data.json` (IDs, fields) match trace documentation.
4. Log any missing modules/forms or renamed assets.

### Step D – Timesheet Comprehensive Map Update
1. Compare Phase 01 sections in `analysis/process-analysis/comprehensive-process-map.md` with verified details.
2. Update workflow triggers, conditions, and action summaries to reflect the latest findings.
3. Record timestamp + verification status inside the map (e.g., “Verified 2025-09-18 vs `v4-flow-567293814.json`).

### Step E – Discrepancy Logging
1. For each mismatch or unclear behaviour, append an entry to the verification log (include workflow/module IDs, expected vs actual, recommended follow-up).
2. Summarize unresolved issues at the top of the log for quick triage.

## 4. Automation & Scripts
- Run `analysis/timesheet_process/shared/verification/verify_phase.py --phase foundation` to execute the automated checks (workflows, CMS assets, properties).
- Additional arguments allow verifying other phases (e.g., `--phase-dir`, `--trace`), making the script reusable for Phase 02.
- The script writes its log to the phase’s `verification/logs/` directory by default.

## 5. Completion Criteria
- `FOUNDATIONS-TRACE.md` entries confirmed against exports, with mismatches documented.
- `analysis/process-analysis/comprehensive-process-map.md` updated with verified data.
- Verification log committed to `analysis/timesheet_process/phases/01-foundation/verification/logs/` for audit trail.
- Outstanding issues (if any) added to `foundations-build-notes.md` and the improvement plan for action.

Follow this plan prior to moving on to Phase 02 documentation work.


