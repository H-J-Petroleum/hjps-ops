# Asset Inventory

| Asset | Type | Description | Reference |
| --- | --- | --- | --- |
| `data/raw/ai-context/ai-context-export/data-model/hj_timesheets-schema-2-26173281.json` | Schema export | Primary reference for timesheet properties and associations. | Use to confirm property labels/types before edits. |
| `data/raw/ai-context/ai-context-export/data-model/hj_consultants-schema-2-26103040.json` | Schema export | Defines consultant pricing fields that WF-11 reads. | Validate whenever consultant pricing model changes. |
| `data/raw/ai-context/ai-context-export/data-model/contacts_schema.json` | Schema export | Contains `cg_*`, `quote_*`, and approval fields used as staging arrays. | Check when adding/removing staged properties. |
| `data/raw/workflows/workflow-567497868-v4.json` | Workflow export | Shows how custom code maps staging data to timesheet fields. | Review before modifying custom code references. |
| `analysis/timesheet_process/phases/02-timesheet-creation/DATA-ARCHITECTURE.md` | Documentation | Summaries of object relationships and outstanding questions. | Keep in sync after schema updates. |

