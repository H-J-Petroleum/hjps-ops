# Association Reference

| Relationship | From Object | To Object | Association Type ID | Notes |
| --- | --- | --- | --- | --- |
| Project ↔ Deal | `2-26103074` | `0-3` (Deal) | 197 / 198 | Primary project-deal link created in WF-03. |
| Project ↔ Customer | `2-26103074` | `0-2` (Company) | 207 / 208 | Customer label `project_customer`. |
| Project ↔ Operator | `2-26103074` | `0-2` (Company) | 205 / 206 | Operator label `project_operator`. |
| Project ↔ Consultant | `2-26103074` | `0-1` (Contact) | 209 / 210 | Grants project access for portal + workflows. |
| Service ↔ Deal | `2-26102982` | `0-3` (Deal) | 145 / 146 | Recruiting deal linkage for service catalog. |
| Consultant Scope ↔ Contact | `2-26103040` | `0-1` (Contact) | 179 / 180 | Scope record belongs to consultant contact. |
| Timesheet ↔ Project | `2-26173281` | `2-26103074` | 215 / 216 | Included for downstream reference. |

_All IDs sourced from `data/curated/ai-context/custom-objects/*.json` exports as of 2025-09-30._
