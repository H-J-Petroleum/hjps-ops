# {{label}} – Documentation Status

Last updated: {{status.lastUpdated}}

## Delivered Artefacts
{{#status.delivered}}
- {{.}}
{{/status.delivered}}

## Gaps To Fill
| Subprocess | Outstanding Items |
| --- | --- |
{{#status.gaps}}
| `{{subprocess}}` | {{items}} |
{{/status.gaps}}

## Next Actions
{{#status.nextActions}}
{{@indexPlusOne}}. {{.}}
{{/status.nextActions}}

> Generated via scripts/agent-core/generate-phase-docs.js using shared/source/phases.json