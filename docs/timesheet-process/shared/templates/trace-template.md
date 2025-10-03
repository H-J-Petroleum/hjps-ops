# {{trace.title}}

{{trace.description}}

> Generated via scripts/agent-core/generate-phase-docs.js using shared/source/phases.json

## 1. Phase Overview

{{#trace.overview.processSummary}}- **Process summary:** `{{trace.overview.processSummary}}`
{{/trace.overview.processSummary}}{{#trace.overview.status}}- **Status ledger:** `{{trace.overview.status}}`
{{/trace.overview.status}}{{#trace.overview.readiness}}- **Readiness report:** `{{trace.overview.readiness}}`
{{/trace.overview.readiness}}{{#trace.overview.sourceData}}- **Source data:**
{{#trace.overview.sourceData}}
  - `{{.}}`
{{/trace.overview.sourceData}}
{{/trace.overview.sourceData}}{{#trace.overview.dependencies}}- **Dependencies:**
{{#trace.overview.dependencies}}
  - {{.}}
{{/trace.overview.dependencies}}
{{/trace.overview.dependencies}}

{{trace.sequenceNote}}

{{#trace.sections}}
## {{@sectionNumber}}. {{title}}

**Purpose:** {{purpose}}

{{#workflows}}
| Step | Workflow / Asset | Trigger | Actions | Result |
| --- | --- | --- | --- | --- |
{{#workflows}}
| {{step}} | {{#id}}{{name}} ({{id}}){{/id}}{{^id}}{{name}}{{/id}} | {{trigger}} | {{actions}} | {{result}} |
{{/workflows}}
{{/workflows}}
{{#properties}}
| Object | Property | Purpose |
| --- | --- | --- |
{{#properties}}
| {{object}} | `{{property}}` | {{purpose}} |
{{/properties}}
{{/properties}}
{{#urls}}
| Property / Label | URL Pattern | Source |
| --- | --- | --- |
{{#urls}}
| {{#property}}`{{property}}`{{/property}}{{^property}}{{label}}{{/property}} | {{pattern}} | {{source}} |
{{/urls}}
{{/urls}}
{{#associations}}
| Association Type | Relationship |
| --- | --- |
{{#associations}}
| {{type}} | {{relationship}} |
{{/associations}}
{{/associations}}
{{#inputs}}
### Inputs
{{#inputs}}
- {{.}}
{{/inputs}}
{{/inputs}}
{{#outputs}}
### Outputs
{{#outputs}}
- {{.}}
{{/outputs}}
{{/outputs}}
{{#notes}}
### Notes
{{#notes}}
- {{.}}
{{/notes}}
{{/notes}}

{{/trace.sections}}