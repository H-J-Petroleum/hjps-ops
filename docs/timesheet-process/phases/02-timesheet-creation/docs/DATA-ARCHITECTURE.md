# Timesheet Creation Data Architecture Overview

Phase 02 focuses on the consultant-facing timesheet portal and the HubSpot objects that support line-item creation, management, and approval handoff.

## 1. Core Objects & Properties

### Contact (0-1)
| Property | Source | Purpose |
| --- | --- | --- |
| `hj_notify_project_id`, `hj_notify_project_object_id`, `hj_notify_project_name` | WF-10 | Identify the project granted timesheet access and pass the custom object ID for associations. |
| `hj_notify_project_customer`, `hj_notify_project_operator` | WF-10 | Surface customer/operator context inside portal modules. |
| `hj_notify_timesheet_link` | WF-10 | HTML button containing the encrypted `/insert-timesheet-step-0` URL. |
| `submitted_as_timesheet_contact` | Timesheet forms (`Insert Line Items`, `Update Timesheet`) | Flags whether the submitting user is a delegate; drives contact resolution in WF-11. |
| `main_contact_id`, `main_contact_email` | Timesheet forms | Store the original consultant when a delegate submits line items. |
| `cg_*` arrays (project, wells, units, dates, start/end times, ordinal numbers) | `hjp-insert-timesheet-01.module`, `hjp-insert-timesheet-02-01.module` | Staging fields for WF-11 to construct `hj_timesheets` records. |
| `quote_consultant_id`, `quote_consultant_name`, `quote_customer_id` | `hjp-insert-timesheet-02-01.module` | Provide consultant billing terms/type/account for line-item metadata. |
| `approval_timesheet_ids_array`, `response_approval_timesheet_ids_array` | `hjp-insert-timesheet-06-my-timesheets.module` + Phase 03 workflows | Track which timesheets moved into approval or were processed by responses. |

### HJ Timesheets (Custom object `2-26173281`)
| Property | Source | Purpose |
| --- | --- | --- |
| `timesheet_project_id`, `timesheet_project_name` | WF-11 | Link each line item to the project the consultant selected. |
| `timesheet_consultant_id`, `timesheet_consultant_email`, `timesheet_consultant_full_name` | WF-11 | Persist consultant identity for approvals and reporting. |
| `timesheet_well`, `timesheet_payment_deal_id` | WF-11 | Map to the specific well/AFE returned by `hj_consultants`. |
| `timesheet_role`, `timesheet_job_service`, `timesheet_billing_frequency` | WF-11 | Describe the work performed and billing unit. |
| `timesheet_price`, `timesheet_hj_price`, `timesheet_quantity` | WF-11 | Consultant vs H&J rates and quantities for the billing engine. |
| `timesheet_total_price`, `timesheet_hj_total_price` | WF-11 | Calculated totals saved at creation. |
| `timesheet_start_date`, `timesheet_end_date`, `timesheet_start_time`, `timesheet_end_time` | WF-11 | Capture working window for each line. |
| `timesheet_unique_id` | WF-11 (post-update) | Generated as `{project_id}-{objectId}` for unique lookup. |
| `timesheet_approval_status` | WF-11 (default `Created`), Phase 03 workflows | Drives state machine for approvals (`Created`, `Submitted`, `Approved`, `Rejected`, `Re-Submitted`). |
| `timesheet_trigger_status` | Timesheet forms + WF-12 | Signals delete/cleanup operations (`Delete Existing`). |
| `bill_account`, `bill_description`, `terms__number_format_`, `bill_terms`, `type`, `consultant_bill_account` | WF-11 | Provide accounting metadata for downstream invoicing and GL export. |

### HJ Consultants (Custom object `2-26103040`)
| Property | Source | Purpose |
| --- | --- | --- |
| `consultant_deal_id`, `payment_deal_id`, `sales_deal_id` | Scope approvals & WF-03 | Provide the deal context used by portal modules and WF-11. |
| `consultant_role`, `job_service`, `well` | WF-09 + manual edits | Determine which wells/roles are available in the portal. |
| `hourly_role_price`, `daily_role_price`, `per_each_price`, `per_mile_price`, `fee_one_time_price` | WF-09 | Consultant pricing used to calculate totals in WF-11. |
| `hj_hj_hourly_price`, `hj_hj_daily_price`, `hj_hj_per_each_price`, `hj_hj_per_mile_price`, `hj_hj_fee_one_time_price` | WF-09 | H&J baseline pricing for internal margin tracking. |
| `hj_project_id`, `hj_project_name`, `hj_project_billing_frequency` | WF-03 / project creation | Align consultant records with current project selection in the portal. |

### HJ Projects (Custom object `2-26103074`)
| Property | Source | Purpose |
| --- | --- | --- |
| `hj_project_id` | Project creation workflow | Shared key used across WF-10, portal modules, and WF-11. |
| `hj_project_is_locked` | Manual toggle / WF-29 | Blocks portal access when a project is closed or under billing review. |
| `hj_sales_deal_owner_email` | WF-03 | Used for downstream notifications if approvals stall. |

### Deal (0-3)
| Property | Source | Purpose |
| --- | --- | --- |
| `link_for_consultant` | WF-01 | Primary source for consultant timesheet portal link (reused by WF-10). |
| `hj_project_is_locked` (deal-level) | WF-29 | Mirrors project lock state for CRM visibility; referenced by portal modules. |

## 2. Associations & Relationship Labels
| Association | Type ID | Source | Usage |
| --- | --- | --- | --- |
| Contact ↔ HJ Project | 210 | WF-10 custom code | Grants consultant access to the project in Step 0. |
| Contact ↔ HJ Timesheet | 280 | WF-11 / WF-12 | Links created line items to the submitting consultant or delegate. |
| HJ Timesheet ↔ Form submission | 251/252 | HubSpot | Tracks originating form submission for audit (insert/update/delete forms). |
| HJ Timesheet ↔ Note / Task / Email | 237/233/231 (and inverses) | Phase 03 approvals | Attach approval notes, tasks, and notification emails. |

## 3. Data Flow Summary
1. **Portal entry (WF-10 + Step 0):** Consultant receives encrypted URL, portal decrypts ID, and surfaces authorised projects based on Association 210.
2. **Context staging (Steps 1–2):** Modules populate `cg_*`, `quote_*`, and `hj_terms` contact fields that describe each requested line item.
3. **Workflow ingestion (WF-11):** Custom code reads staged fields, fetches supporting data from `hj_consultants`, and batch creates `hj_timesheets` records with calculated totals and unique IDs.
4. **Portal management (Step 6):** Consultants view status-filtered lists, trigger updates/deletes via forms, and request approval, populating `approval_timesheet_ids_array`.
5. **Delete path (WF-12):** When `timesheet_trigger_status = "Delete Existing"`, the workflow removes the custom object and clears orphaned data.
6. **Handoff:** Approval-related arrays feed Phase 03 workflows without altering approval logic inside this phase.

## 4. Storage Patterns & Observations
| Pattern | Location | Benefits | Risks |
| --- | --- | --- | --- |
| Comma-separated arrays on contacts (`cg_*`) | Contact object | Keeps portal multi-line submissions lightweight without extra custom objects. | Requires custom code parsing (WF-11); risk of mismatched array lengths or delimiter issues. |
| Derived billing metadata on `hj_timesheets` | `timesheet_*`, `bill_*`, `terms__number_format_` | Stores all accounting context per line item for reuse in billing. | Values frozen at creation; updates require re-running WF-11 logic or companion workflow (not exported). |
| Encrypted consultant ID in URL | WF-10 / portal | Protects raw contact IDs while allowing deterministic lookup. | Static offset (+3522) is reversible; should move to tokenized service long term. |
| HTML links in contact properties (`hj_notify_timesheet_link`) | WF-10 | Enables immediate portal launch from CRM. | Inline HTML is brittle; prefers CRM cards/UI extensions for future iterations. |
| `timesheet_trigger_status` control flag | Contact & `hj_timesheets` | Single property drives delete/cleanup workflow. | Missing update workflow export prevents similar handling for updates; risk of stale line items. |

## 5. Outstanding Questions & Follow-ups
- Export for the **Update Timesheet** workflow is missing; confirm whether automation lives outside HubSpot or re-run exporter to capture it.
- `cg_*` arrays do not capture timezone; evaluate whether timesheet start/end times need timezone offsets for billing accuracy.
- `timesheet_unique_id` is generated as `{project_id}-{objectId}`; verify if any downstream systems rely on additional prefixes (e.g., consultant code) before enforcing uniqueness masks.
- Assess whether `hj_consultants` should store per-well billing overrides to avoid WF-11 fetching loops for every submission.

Document updates here whenever schemas or workflows change for Phase 02.
