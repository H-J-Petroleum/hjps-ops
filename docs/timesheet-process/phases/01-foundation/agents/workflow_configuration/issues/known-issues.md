# Known Issues – Workflow Configuration (Foundations)

## Current Issues

### 1. Approval Workflow Exports Missing
- Description: Workflow exports for IDs 1680618036 and 1682422902 absent from data/raw/workflows.
- Impact: Foundations cannot validate readiness status before handoff.
- Status: Resolved (2025-09-18)
- Resolution: Re-exported via `node scripts/hubspot/node/context/generate-system-context.js --export=workflows --ids=1680618036,1682422902`; saved as `v4-workflow-1680618036.json` and `v4-workflow-1682422902.json` in `data/raw/workflows/`.

## Resolved Issues

### Approval Workflow Exports Restored (2025-09-18)
- Description: Re-exported approval workflows for handoff readiness.
- Resolution: Stored new `v4-workflow-1680618036.json` and `v4-workflow-1682422902.json` under `data/raw/workflows/`.

Last updated: 2025-09-18
