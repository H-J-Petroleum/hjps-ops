# Project Configuration Context Extract
_Generated: 2025-09-18T23:55:27.285102_

### Custom Project Properties

| Property | Label | Type | Required | Description |
|---|---|---|---|---|
| `hj_approver_email` | HJ Approver Email | string/text |  |  |
| `hj_approver_id` | HJ Approver Id | string/text |  |  |
| `hj_approver_is` | Approver is: | enumeration/select |  |  |
| `hj_approver_name` | HJ Approver Name | string/text |  |  |
| `hj_class` | Class | string/text |  |  |
| `hj_customer` | Customer | string/text |  |  |
| `hj_customer_id` | HJ Customer ID | string/text |  |  |
| `hj_operator` | Operator | string/text |  |  |
| `hj_operator_id` | HJ Operator ID | string/text |  |  |
| `hj_primary_contact_email` | HJ Primary Contact Email | string/text |  |  |
| `hj_primary_contact_id` | HJ Primary Contact Id | string/text |  |  |
| `hj_primary_contact_name` | HJ Primary Contact Name | string/text |  |  |
| `hj_project_id` | HJ Project ID | string/text |  |  |
| `hj_project_is_locked` | Project is Locked | enumeration/select |  |  |
| `hj_project_name` | Project Name | string/text | ✅ |  |
| `hj_sales_deal_owner_contact_id` | HJ Sales Deal Owner Contact Id | string/text |  |  |
| `hj_sales_deal_owner_email` | HJ Sales Deal Owner Email | string/text |  |  |
| `hj_sales_deal_owner_name` | HJ Sales Deal Owner Name | string/text |  |  |
| `hj_sales_deal_record_id` | HJ Sales Deal Record Id | string/text |  |  |
| `hj_taxable` | Taxable | string/text |  |  |
| `hj_terms` | Terms | string/text |  |  |
### HubSpot Core Properties

| Property | Label | Type | Description |
|---|---|---|---|
| `hs_all_accessible_team_ids` | All teams | enumeration/checkbox | The team IDs, including the team hierarchy, of all default and custom owner properties for this record. |
| `hs_all_assigned_business_unit_ids` | Business units | enumeration/checkbox | The business units this record is assigned to. |
| `hs_all_owner_ids` | All owner IDs | enumeration/checkbox | Values of all default and custom owner properties for this record. |
| `hs_all_team_ids` | All team IDs | enumeration/checkbox | The team IDs of all default and custom owner properties for this record. |
| `hs_created_by_user_id` | Created by user ID | number/number | The user who created this record. This value is set automatically by HubSpot. |
| `hs_createdate` | Object create date/time | datetime/date | The date and time at which this object was created. This value is automatically set by HubSpot and may not be modified. |
| `hs_lastmodifieddate` | Object last modified date/time | datetime/date | Most recent timestamp of any property update for this object. This includes HubSpot internal properties, which can be visible or hidden. This property is updated automatically. |
| `hs_merged_object_ids` | Merged record IDs | enumeration/checkbox | The list of record IDs that have been merged into this record. This value is set automatically by HubSpot. |
| `hs_object_id` | Record ID | number/number | The unique ID for this record. This value is set automatically by HubSpot. |
| `hs_object_source` | Record creation source | string/text | Raw internal PropertySource present in the RequestMeta when this record was created. |
| `hs_object_source_detail_1` | Record source detail 1 | string/text | First level of detail on how this record was created. |
| `hs_object_source_detail_2` | Record source detail 2 | string/text | Second level of detail on how this record was created. |
| `hs_object_source_detail_3` | Record source detail 3 | string/text | Third level of detail on how this record was created. |
| `hs_object_source_id` | Record creation source ID | string/text | Raw internal sourceId present in the RequestMeta when this record was created. |
| `hs_object_source_label` | Record source | enumeration/select | How this record was created. |
| `hs_object_source_user_id` | Record creation source user ID | number/number | Raw internal userId present in the RequestMeta when this record was created. |
| `hs_owning_teams` | Owning Teams | enumeration/checkbox | The teams that are attributed to this record. |
| `hs_pinned_engagement_id` | Pinned Engagement ID | number/number | The object ID of the current pinned engagement. |
| `hs_read_only` | Read only object | bool/booleancheckbox | Determines whether a record can be edited by a user. |
| `hs_shared_team_ids` | Shared teams | enumeration/checkbox | Additional teams whose users can access the record based on their permissions. This can be set manually or through Workflows or APIs. |
| `hs_shared_user_ids` | Shared users | enumeration/checkbox | Additional users that can access the record based on their permissions. This can be set manually or through Workflows and APIs. |
| `hs_unique_creation_key` | Unique creation key | string/text | Unique property used for idempotent creates |
| `hs_updated_by_user_id` | Updated by user ID | number/number | The user who last updated this record. This value is set automatically by HubSpot. |
| `hs_user_ids_of_all_notification_followers` | User IDs of all notification followers | enumeration/checkbox | The user IDs of all users that have clicked follow within the object to opt-in to getting follow notifications |
| `hs_user_ids_of_all_notification_unfollowers` | User IDs of all notification unfollowers | enumeration/checkbox | The user IDs of all object owners that have clicked unfollow within the object to opt-out of getting follow notifications |
| `hs_user_ids_of_all_owners` | User IDs of all owners | enumeration/checkbox | The user IDs of all owners of this record. |
| `hs_was_imported` | Performed in an import | bool/booleancheckbox | Object is part of an import |
| `hubspot_owner_assigneddate` | Owner assigned date | datetime/date | The most recent timestamp of when an owner was assigned to this record. This value is set automatically by HubSpot. |
| `hubspot_owner_id` | Owner | enumeration/select | The owner of the object. |
| `hubspot_team_id` | Owner's main team | enumeration/select | The main team of the record owner. This value is set automatically by HubSpot. |

### Object Associations

| Association | Target Object | Association ID | Cardinality |
|---|---|---|---|
| `primary_project_deal` | deals | 197 | ONE_TO_MANY |
| `type_2_26103074_to_deal` | deals | 199 | ONE_TO_MANY |
| `type_2_118270515_to_company` | companies | 201 | ONE_TO_MANY |
| `type_2_118270515_to_contact` | contacts | 203 | ONE_TO_MANY |
| `project_operator` | companies | 205 | ONE_TO_MANY |
| `project_operator` | hj_projects | 206 | ONE_TO_MANY |
| `project_customer` | companies | 207 | ONE_TO_MANY |
| `project_customer` | hj_projects | 208 | ONE_TO_MANY |
| `project_consultant` | contacts | 209 | ONE_TO_MANY |
| `project_consultant` | hj_projects | 210 | ONE_TO_MANY |

### CMS Modules

| Module | Label/Description | Field count | Key fields |
|---|---|---|---|
| `hjp-consultants-line-item-request-approval-01.module` | HJP - Consultant Line Items Request Approval | 0 | — |
| `hjp-consultants-line-item-request-approval-02.module` | HJP - Consultant Line Items Request Approval -02 | 0 | — |
| `hjp-customer-approval-response-customer-01.module` | HJP - Customer Approval Response - For Customer | 0 | — |
| `hjp-customer-approval-response-hjpetro-01.module` | HJP - Customer Approval Response - For H&J Petro | 0 | — |
| `hjp-delete-timesheet-01.module` | HJP - Delete Timesheet - 01 | 1 | style |
| `hjp-field-ticket-for-approval-01-secure.module` | (no label) | ? | — |
| `hjp-field-ticket-for-approval-01.module` | HJP - Field Ticket for Approval - Step 01 | 0 | — |
| `hjp-field-ticket-for-approval-02.module` | HJP - Field Ticket for Approval - Step 02 | 0 | — |
| `hjp-field-ticket-for-approval-03.module` | HJP - Field Ticket for Approval - Step 03 | 0 | — |
| `hjp-field-ticket-for-approval-autosubmit-test.module` | HJP - Field Ticket for Approval - Autosubmit-test | 0 | — |
| `hjp-filed-ticket-for-approval-04-thank-you.module` | HJP - Field Ticket for Approval - Step 04 - ThankYou | 0 | — |
| `hjp-h-and-j-field-ticket-for-approval-01-secure.module` | (no label) | ? | — |
| `hjp-h-and-j-field-ticket-for-approval-01.module` | HJP - H&J-Field Ticket for Approval - Step 01 | 0 | — |
| `hjp-insert-timesheet-0-select-project.module` | HJP - Insert Timesheet - Select Project | 0 | — |
| `hjp-insert-timesheet-01.module` | HJP - Insert Timesheet - 01 | 0 | — |
| `hjp-insert-timesheet-02-01.module` | HJP - Insert Timesheet - 02/01 | 0 | — |
| `hjp-insert-timesheet-02-02.module` | HJP - Insert Timesheet - 02/02 | 0 | — |
| `hjp-insert-timesheet-03.module` | HJP - Insert Timesheet - 03 | 0 | — |
| `hjp-insert-timesheet-04.module` | HJP - Insert Timesheet - 04 | 0 | — |
| `hjp-insert-timesheet-05-overview.module` | HJP - Insert Timesheet - 05 - Overview | 0 | — |
| `hjp-insert-timesheet-06-my-timesheets.module` | HJP - Insert Timesheet - 06 - My Timesheets | 0 | — |
| `hjp-line-items-approval-01.module` | HJP -Line items Approval - 01 | 0 | — |
| `hjp-line-items-approval-re-01.module` | HJP - Line Items Re-Approval - 01 | 0 | — |
| `hjp-new-timesheet-entry-01-FIRST-KEEP IT.module` | New Timesheet Entry - FIRST KEEP IT | 0 | — |
| `hjp-new-timesheet-entry-01.module` | New Timesheet Entry - 01 | 0 | — |
| `hjp-new-timesheet-entry-02.module` | New Timesheet Entry - 02 | 0 | — |
| `hjp-new-timesheet-entry-03-NIGHTSHIFT.module` | New Timesheet Entry - 03 | 0 | — |
| `hjp-new-timesheet-entry-03.module` | New Timesheet Entry - 03 | 0 | — |
| `hjp-new-timesheet-entry-04-redirect.module` | New Timesheet Entry - 04 - REDIRECT | 0 | — |
| `hjp-update-rejected-timesheet-01.module` | HJP - Update Rejected Timesheet - 01 | 0 | — |
| `hjp-update-rejected-timesheet-02.module` | HJP - Update Rejected Timesheet - 02 | 0 | — |
| `hjp-update-timesheet-01.module` | HJP - Update Timesheet - 01 | 0 | — |
| `hjp-update-timesheet-02.module` | HJP - Update Timesheet - 02 | 0 | — |
| `hjp-update-timesheet-03.module` | HJP - Update Timesheet - 03 | 0 | — |
| `hjp-update-timesheet-04.module` | HJP - Update Timesheet - 04 | 0 | — |
| `hjp-update-timesheet-05-overview.module` | HJP - Update Timesheet - 05 | 0 | — |
| `hjp-update-timesheet-06-last-step.module` | HJP - Update Timesheet - 06 - Last Step | 0 | — |

## Workflows

### Consultant Approval Request

- **Workflow ID:** `567500453`
- **Name:** 13. Consultant Approval Request
- **Object Type:** unknown (CONTACT_FLOW)
- **Total Actions:** 11

**Actions:**
- `1` · LIST_BRANCH (LIST_BRANCH) → branches=0
- `2` · CUSTOM_CODE (CUSTOM_CODE)
- `3` · CUSTOM_CODE (CUSTOM_CODE)
- `4` · CUSTOM_CODE (CUSTOM_CODE)
- `5` · CUSTOM_CODE (CUSTOM_CODE)
- `6` · CUSTOM_CODE (CUSTOM_CODE)
- `7` · CUSTOM_CODE (CUSTOM_CODE)
- `8` · CUSTOM_CODE (CUSTOM_CODE)
- `9` · CUSTOM_CODE (CUSTOM_CODE)
- `10` · CUSTOM_CODE (CUSTOM_CODE)
- `11` · SINGLE_CONNECTION (SINGLE_CONNECTION)

### Approval Reminder 1

- **Workflow ID:** `567466561`
- **Name:** 15. Reminder 1 - Consultant Approval Request
- **Object Type:** unknown (PLATFORM_FLOW)
- **Total Actions:** 3

**Actions:**
- `1` · LIST_BRANCH (LIST_BRANCH) → branches=0
- `2` · CUSTOM_CODE (CUSTOM_CODE)
- `3` · CUSTOM_CODE (CUSTOM_CODE)

### Approval Reminder 3

- **Workflow ID:** `567463273`
- **Name:** 19. Reminder 3 - Consultant Approval Request
- **Object Type:** unknown (PLATFORM_FLOW)
- **Total Actions:** 3

**Actions:**
- `1` · LIST_BRANCH (LIST_BRANCH) → branches=0
- `2` · CUSTOM_CODE (CUSTOM_CODE)
- `3` · CUSTOM_CODE (CUSTOM_CODE)

### Customer Approval Response

- **Workflow ID:** `1680618036`
- **Name:** 21. Customer Approval Response (Approval)
- **Object Type:** HJ Approval (2-26103010)
- **Status:** ENABLED
- **Source:** v4 Platform Flow

### H&J Approval Response

- **Workflow ID:** `1682422902`
- **Name:** 26. H&J Approval Response (Approval)
- **Object Type:** HJ Approval (2-26103010)
- **Status:** ENABLED
- **Source:** v4 Platform Flow