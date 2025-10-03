# Data Relationships – Foundations Overview

Foundations establishes object schemas and associations so Approval and later phases can run without data fixes. This subprocess documents the key relationships created by Workflows 01, 03, 04, 05, and the forms/modules they rely on.

## Key Relationships
- **Deal → Consultant** (association type 4) created via consultant assignment (WF-06) after WF-01 prepares metadata.
- **Deal → Customer/Operator** (association labels “Customer”, “Operator”) validated in WF-03.
- **Deal → Well** (association type 128) and **Company → Well** (type 126) created through WF-04/WF-05.
- **Deal → Project** (`primary_project_deal` 197) and reciprocal project associations established when the project creation workflow runs (after WF-03 passes).

## Schema Sources
| Object | Source JSON |
|---|---|
| Deals | `data/raw/ai-context/ai-context-export/data-model/deals_schema.json` |
| HJ Projects | `.../hj_projects-schema-2-26103074.json` |
| HJ Approvals | `.../hj_approvals-schema-2-26103010.json` |
| HJ Wells | `.../hj_wells-schema-2-26102958.json` |
| HJ Consultants | `.../hj_consultants-schema-2-26103040.json` |

Use the shared extraction script (`extract_project_configuration_context.py`) to regenerate property and association tables whenever schemas change.

_Last reviewed: 2025-09-18._
