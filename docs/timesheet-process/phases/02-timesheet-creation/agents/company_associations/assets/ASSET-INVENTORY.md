# Asset Inventory

| Asset | Type | Description | Reference |
| --- | --- | --- | --- |
| `hjp-insert-timesheet-01.module` | CMS module | Retrieves consultant/project/well context and writes staging properties for WF-11. | `data/raw/hubspot-cms-assets/Timesheets-Theme/modules/hjp-insert-timesheet-01.module` |
| `hjp-insert-timesheet-02-01.module` | CMS module | Captures well/role/unit selections and pushes `cg_*` arrays to the contact. | `data/raw/hubspot-cms-assets/Timesheets-Theme/modules/hjp-insert-timesheet-02-01.module` |
| WF-11 custom code | Workflow | Batch-creates `hj_timesheets` records and stamps association fields. | `data/raw/workflows/workflow-567497868-v4.json` |
| WF-12 custom code | Workflow | Deletes `hj_timesheets` records when `timesheet_trigger_status` = `Delete Existing`. | `data/raw/workflows/v4-flow-567296849.json` |
| `hj_consultants` custom object | HubSpot object | Stores pricing, well, and deal IDs mirrored onto timesheets. | `data/raw/ai-context/ai-context-export/data-model/hj_consultants-schema-2-26103040.json` |
| `contact_to_hj_timesheets` association (ID 280) | Association | Links consultants to line items for approvals and reporting. | `data/raw/ai-context/ai-context-export/data-model/hj_timesheets-schema-2-26173281.json` |
