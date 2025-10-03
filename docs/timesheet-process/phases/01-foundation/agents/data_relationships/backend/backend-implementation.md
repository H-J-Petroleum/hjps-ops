# Data Relationships Backend Notes

Document the association and schema contracts enforced during Foundations.

## Association Types
| Type ID | Relationship |
|---|---|
| 4 | Deal ↔ Consultant (created in WF-06) |
| 126 | Company ↔ HJ Well (WF-04) |
| 128 | Deal ↔ HJ Well (WF-04/05) |
| 197 / 198 | Deal ↔ HJ Project (primary project) |
| 205 / 206 | Project ↔ Operator company |
| 207 / 208 | Project ↔ Customer company |
| 209 / 210 | Project ↔ Consultant contact |

## Workflow Touchpoints
- **WF-01 (567275018):** Adds consultant identifiers used later in associations.
- **WF-03 (567293814):** Validates customer/operator/approver/primary associations and records errors when missing.
- **WF-04/05:** Create well associations (types 126/128).
- **Project Creation Workflow:** Uses the validated deal to populate `hj_projects` associations.

## Schema Monitoring
Use the data-model JSON exports listed in the overview to monitor property changes. Extend the extractor script if you need additional object summaries.

_Last reviewed: 2025-09-18._
