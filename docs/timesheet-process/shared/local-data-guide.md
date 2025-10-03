# Local Data Access Guide

*Shared reference for locating HubSpot exports after the raw/curated/archive restructure*

## 🗂️ Directory Map

| Layer | Purpose | Key Paths |
|-------|---------|-----------|
| `data/raw/` | Authoritative HubSpot exports used as source truth | `ai-context/ai-context-export/`, `workflows/`, `themes/Timesheets-Theme/`, `hubspot-production/` |
| `data/curated/` | Processed bundles tailored for AI prompt packs | `ai-context/` (enhanced summaries, workflow analysis) |
| `data/archive/` | Frozen historical exports and cleanup snapshots | `20250916-cleanup/`, `20250918-temp/`, `html/` |

## 📚 Frequently Used Assets

### Schemas & Sample Records
- Location: `data/raw/ai-context/ai-context-export/data-model/`
- Objects: Contacts, Companies, Deals, `hj_projects`, `hj_timesheets`, `hj_approvals`, `hj_consultants`, `hj_services`, `hj_wells`

### Platform Workflows
- Location: `data/raw/workflows/`
- Tip: Files named `workflow-*-<ID>-v4.json` (v3) and `v4-flow-<ID>.json` (v4 API)

### CMS Modules
- Location: `data/raw/themes/Timesheets-Theme/modules/`
- Patterns: `hjp-*-timesheet-*.module`, `hjp-*-approval-*.module`, `hjp-field-ticket-for-approval-*.module`

### Forms & UI Metadata
- Forms: `data/raw/ai-context/ai-context-export/forms/`
- Production references: `data/raw/hubspot-production/hubspot-production-assets/forms/`

### Curated Bundles
- Enhanced context & narratives: `data/curated/ai-context/`
- Manifest: `data/curated/manifest.json`

## 🔧 Quick Commands

```bash
# List schema files
ls data/raw/ai-context/ai-context-export/data-model

# Search workflows by ID
grep -r "567500453" data/raw/workflows

# Find approval-related modules
find data/raw/themes/Timesheets-Theme/modules -name "*approval*"

# Inspect curated bundle metadata
cat data/curated/manifest.json | jq '.'
```

## 🧬 Tooling Hooks
- **Schema extraction:** `pwsh scripts/hubspot/powershell/data-extraction/extract-schema-data.ps1 -ObjectType hj_projects`
- **Workflow refresh:** `pwsh scripts/hubspot/powershell/api/fetch-workflows.ps1 -Ids 1680618036 1682422902`
- **Full context export:** `node scripts/hubspot/node/context/generate-system-context.js --export=schema,cms,workflows`

## 🛑 Handling Rules
- Do not hand-edit files in `data/raw/`; regenerate via exporters.
- Record curated bundle changes in `data/curated/manifest.json` (with source snapshot timestamp).
- Keep `data/archive/` immutable unless restoring old assets; if you restore, log the action in CHANGELOG.

This guide keeps the agents and human operators aligned on where to fetch canonical data within the new structure.
