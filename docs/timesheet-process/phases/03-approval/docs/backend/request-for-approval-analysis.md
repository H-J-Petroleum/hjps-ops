# 🎯 Request for Approval Process Analysis

*Generated: September 17, 2025*  
*Focused analysis of the "Request for Approval" form submission and workflow chain*

## 🚨 Critical Discovery: Target Object is Contact, Not HJ Approval

**IMPORTANT:** The timesheet submission and approval trigger target object is **Contact (0-1)**, not HJ Approval. This is a fundamental architectural understanding that affects our entire sprint plan.

---

## 📋 **REQUEST FOR APPROVAL PROCESS WORKFLOW CHAIN**

### **🎯 Entry Point: Timesheet Creation Process**

#### **Step 0: Project Selection**
- **Module:** `hjp-insert-timesheet-0-select-project`
- **URL Pattern:** `/insert-timesheet-step-0?consultant_id=[ENCRYPTED]&consultant_email=[EMAIL]&consultant_name=[NAME]`
- **Purpose:** Consultant selects project and chooses action
- **Options:**
  - **"New Line Item"** → `/insert-timesheet-step-1` (creates new timesheet)
  - **"Existing Line Items"** → `/insert-timesheet-my-timesheets` (manages existing timesheets)

#### **Step 1: New Line Item Creation**
- **Module:** `hjp-insert-timesheet-01` (New Timesheet Entry)
- **URL Pattern:** `/insert-timesheet-step-1?consultant_id=[ENCRYPTED]&consultant_email=[EMAIL]&timesheet_contact=[CONTACT]&email_to_submit=[SUBMIT_EMAIL]&consultant_name=[NAME]&project_id=[ID]`
- **Purpose:** Creates new timesheet line items
- **Process:** Multi-step form for timesheet entry

#### **Step 5: Timesheet Creation Overview**
- **Module:** `hjp-insert-timesheet-05-overview`
- **URL Pattern:** `/insert-timesheet-step-5?consultant_id=[ENCRYPTED]&consultant_email=[EMAIL]&consultant_name=[NAME]&project_id=[ID]`
- **Purpose:** Shows completion overview and redirects to timesheet management
- **Auto-redirect:** After 12 seconds, redirects to timesheet management page

#### **Timesheet Management & Approval Request**
- **Module:** `hjp-insert-timesheet-06-my-timesheets`
- **HubSpot Link:** https://app.hubspot.com/design-manager/1230608/modules/161468337269
- **Local File:** `data/raw/themes/Timesheets-Theme/modules/hjp-insert-timesheet-06-my-timesheets.module/module.html`
- **URL Pattern:** `/insert-timesheet-my-timesheets?consultant_id=[ENCRYPTED]&consultant_email=[EMAIL]&timesheet_contact=[CONTACT]&email_to_submit=[SUBMIT_EMAIL]&consultant_name=[NAME]&project_id=[ID]&line_item_status=[STATUS]&ordinal_number_order=[ORDER]&timesheet_unique_id=[UNIQUE_ID]&consultant_action=[ACTION]`
- **Purpose:** Displays all timesheets for project and provides approval request functionality
- **Key Function:** Contains the **"Request For Approval"** button that triggers the approval workflow chain

#### **COMPLETE PARAMETER SOURCE MAP**

##### **🔍 Parameter Tracing Table (Complete Flow)**

| Parameter | Original Source | How It Gets There | Current Location | Target Object (Property) | Used For |
|-----------|----------------|-------------------|------------------|-------------------------|----------|
| **`consultant_id`** | `Contact.hs_object_id` | WF-01 encrypts (+3522) → Deal.link_for_consultant | `request.query_dict.consultant_id` | **Contact.email** (form submission) | URL chains, decryption |
| **`consultant_email`** | `Contact.email` | WF-01 copies → Deal.consultant_email | `request.query_dict.consultant_email` | **Contact.email** (form submission) | Notifications, form submission |
| **`consultant_name`** | `Contact.firstname + " " + Contact.lastname` | WF-01 concatenates → Deal.consultant_full_name | `request.query_dict.consultant_name` | **Contact.approval_consultant_name** (form submission) | Display, form submission |
| **`project_id`** | `HJ Projects.hj_project_id` | User selects from associated projects (Association 210) | `request.query_dict.project_id` | **Contact.approval_project_id** (form submission) | Timesheet filtering, approval requests |
| **`timesheet_contact`** | `Contact.has_timesheet_contact` | Module checks Contact property | `submit_as_pseudo_contact` | **Contact.submitted_as_timesheet_contact** (form submission) | Delegation logic |
| **`email_to_submit`** | `Contact.email` OR `Contact.timesheets_contact_email` | Module logic based on delegation | `submit_email` | **Contact.email** (form submission) | Form submission target |
| **`line_item_status`** | User dropdown selection | User selects from UI | `request.query_dict.line_item_status` | **N/A** (filtering only) | Timesheet filtering |
| **`ordinal_number_order`** | User dropdown selection | User selects from UI | `request.query_dict.ordinal_number_order` | **N/A** (filtering only) | Timesheet sorting |
| **`timesheet_unique_id`** | `HJ Timesheets.timesheet_unique_id` | Database lookup | `existing_timesheet.results[0].timesheet_unique_id` | **N/A** (delete operations only) | Delete operations |
| **`consultant_action`** | Hardcoded "deleted" | Module sets value | Hardcoded string | **N/A** (tracking only) | Tracking deleted timesheets |

##### **🔄 Complete Data Flow Chain (Step-by-Step)**

```
1. WF-01 (Deal Setup)
   ├── Reads: Contact.hs_object_id, Contact.email, Contact.firstname, Contact.lastname
   ├── Creates: Deal.link_for_consultant (encrypted URL)
   └── Stores: Deal.consultant_email, Deal.consultant_full_name

2. User Clicks Timesheet Link
   ├── URL: /insert-timesheet-step-0?consultant_id=[ENCRYPTED]&consultant_email=[EMAIL]&consultant_name=[NAME]
   └── Parameters: From Deal.link_for_consultant property

3. Project Selection Module (Step 0)
   ├── Decrypts: consultant_id - 3522 = real Contact ID
   ├── Queries: Contact.has_timesheet_contact, Contact.timesheets_contact_email
   ├── Queries: Associated projects (Association 210)
   └── Generates: timesheet_contact, email_to_submit

4. User Chooses Action:
   ├── "New Line Item" → /insert-timesheet-step-1 (creates new timesheet)
   └── "Existing Line Items" → /insert-timesheet-my-timesheets (manages existing)

5. Timesheet Creation Process
   ├── Step 1: New line item entry
   ├── Step 2-4: Multi-step timesheet creation process
   ├── Step 5: Overview and auto-redirect to management
   └── Timesheet Management: Display and approval request

6. Form Submission (Request for Approval)
   ├── Target: Contact object (0-1)
   ├── Fields: All parameters copied back to Contact
   └── Triggers: Workflow 13 (Consultant Approval Request)
```

##### **⚠️ Critical Parameter Issues & Solutions**

| Issue | Root Cause | Solution |
|-------|------------|----------|
| **Missing delegation parameters** | Contact.has_timesheet_contact not set | Set Contact property correctly |
| **Broken URL chains** | Parameters not passed between modules | Ensure all modules pass parameters |
| **Form submission failures** | email_to_submit doesn't match Contact.email | Sync delegation logic |
| **Wrong consultant data** | Deal properties out of sync with Contact | Update WF-01 to refresh Deal properties |
| **Missing project_id** | Project not associated with consultant | Fix Association 210 |

##### **🎯 Quick Debug Reference**

**To find the source of any parameter issue:**
1. **Check Contact object** - Is the original data correct?
2. **Check Deal properties** - Are they in sync with Contact?
3. **Check URL chain** - Are parameters being passed correctly?
4. **Check module logic** - Is delegation logic working?
5. **Check form submission** - Are parameters reaching the form?

**Most common fixes:**
- Update Contact.has_timesheet_contact property
- Refresh Deal.link_for_consultant URL
- Fix Association 210 between Contact and Projects
- Ensure all modules pass parameters in URL chains

#### **Form Submission: "Request For Approval"**
- **Form ID:** `5dd64adc-00b2-4cfa-a69f-4cb068c5c55f`
- **Form Name:** "Request For Approval" (Timesheet Approval Submission)
- **Direct HubSpot Link:** https://app.hubspot.com/forms/1230608/editor/5dd64adc-00b2-4cfa-a69f-4cb068c5c55f/edit
- **Target Object:** **Contact (0-1)** ← **CRITICAL: Form targets Contact, not HJ Approval**

#### **Form Fields (Complete List):**
- `email` → **Source:** `{{ get_submit_email }}` (delegation email)
- `approval_timesheet_ids_array` → **Source:** `document.getElementById("getApproveRejectValue").innerHTML` (selected timesheet IDs)
- `approval_project_name` → **Source:** `{{ hj_projects.results[0].hj_project_name }}` (project name)
- `approval_project_id` → **Source:** `{{ get_project_id }}` (project ID from URL)
- `approval_customer` → **Source:** `{{ timesheet.results[0].timesheet_customer }}` (customer name)
- `approval_operator` → **Source:** `{{ timesheet.results[0].timesheet_operator }}` (operator name)
- `approval_consultant_name` → **Source:** `{{ timesheet.results[0].timesheet_consultant_full_name }}` (consultant name)
- `approver_full_name` → **Source:** `{{ hj_projects.results[0].hj_approver_name }}` (approver name)
- `approver_email` → **Source:** `{{ hj_projects.results[0].hj_approver_email }}` (approver email)
- `approver_unique_id` → **Source:** `{{ hj_projects.results[0].hj_approver_id }}` (approver ID)
- `approver_is` → **Source:** `{{ hj_projects.results[0].hj_approver_is }}` (approver type: Internal/External)
- `approval_sales_deal_id` → **Source:** `{{ timesheet.results[0].timesheet_sales_deal_id }}` (sales deal ID)
- `approval_sales_deal_owner_email` → **Source:** `{{ hj_projects.results[0].hj_sales_deal_owner_email }}` (deal owner email)
- `approval_sales_deal_owner_full_name` → **Source:** `{{ hj_projects.results[0].hj_sales_deal_owner_name }}` (deal owner name)
- `approval_from_date` → **Source:** `setFromDate` (JavaScript calculated from selected timesheets)
- `approval_until_date` → **Source:** `setUntilDate` (JavaScript calculated from selected timesheets)
- `approval_processed_date` → **Source:** `{{local_dt | format_datetime('yyyy-MM-dd', 'America/Chicago')}}` (current date)
- `quote_customer_name` → **Source:** `{{ get_invoice_number_first_part }}` (sequential approval number - **MISLEADING NAME**)
- `submitted_as_timesheet_contact` → **Source:** `{{ get_timesheet_contact }}` (delegation flag - **LEGACY FIELD**)

#### **Special Field Notes:**
- **`quote_customer_name`** → **MISLEADING NAME** - Actually stores sequential approval number (0001, 0002, etc.)
- **`submitted_as_timesheet_contact`** → **LEGACY FIELD** - Designed for form-based workflows, will be deprecated with direct object writes
- **`approval_timesheet_ids_array`** → Populated by JavaScript collecting selected timesheet IDs from UI

---

## 🔄 **CURRENT APPROVAL WORKFLOW CHAIN**

### **Step 1: Form Submission (Current Architecture)**
When the "Request For Approval" form is submitted:
1. **Updates Contact properties** with all form data (form targets Contact object 0-1)
2. **Triggers Workflow 13** (Consultant Approval Request) - **Contact (0-1) target**
3. **Workflow 13 reads Contact properties** and **creates HJ Approval object** using that data

### **Step 2: Workflow 13 - "Consultant Approval Request"**
- **Workflow ID:** 567500453
- **Direct HubSpot Link:** https://app.hubspot.com/workflows/1230608/platform/flow/567500453/edit
- **Object Type:** **Contact (0-1)** ← **CRITICAL: This is the trigger target**
- **Purpose:** Processes approval request and creates HJ Approval object
- **Key Actions:**
  - Reads Contact properties from form submission
  - Creates HJ Approval object using Contact data
  - Determines approver type (`approver_is` property)
  - Sends notifications to appropriate approver

---

## 🔄 **COMPLETE APPROVAL FLOW**

### **Phase 1: Submission**
1. **Consultant** submits timesheets via `hjp-insert-timesheet-06-my-timesheets`
2. **Form submission** updates Contact properties (form targets Contact object 0-1)
3. **Workflow 13** triggers on **Contact object** and **creates HJ Approval object** using Contact properties

### **Phase 2: Processing**
1. **Workflow 13** determines approver type (`approver_is` property)
2. **Creates approval tasks** and sends notifications
3. **Updates timesheet records** with "Submitted for Approval" status

### **Phase 3: Approval Interface**
1. **Internal Approvals** → `hjp-h-and-j-field-ticket-for-approval-01` module
2. **External Approvals** → `hjp-field-ticket-for-approval-01` module
3. **Approval responses** trigger additional workflows

---

## 🎯 **REVISED SPRINT PLAN IMPLICATIONS**

### **Current Sprint Plan Issues:**
1. **Starting Point:** We planned to start with HJ Approval object processing (INCORRECT)
2. **Actual Starting Point:** Should be Contact object workflow triggers
3. **Workflow Focus:** Need to focus on Workflow 13 (Contact-triggered) not HJ Approval workflows

### **Corrected Starting Point:**
1. **Contact Object Analysis:** Understand approval path determination logic
2. **Workflow 13 Deep Dive:** Map all actions and dependencies
3. **Parameter Flow Mapping:** Trace data from Contact to HJ Approval
4. **Approval Interface Analysis:** Understand user-facing approval process

---

## 📊 **CURRENT SYSTEM ARCHITECTURE**

### **Form-Based Design (Current)**
- **Entry Point:** Web modules with form submissions
- **Data Flow:** Module → Form → Contact Properties → Workflow → HJ Approval
- **Dependencies:** Contact properties act as "bridge" between form and approval object
- **Legacy Fields:** `submitted_as_timesheet_contact` designed for form-based workflows

### **Data Flow Pattern**
```
User Interface → Form Submission → Contact Properties → Workflow 13 → HJ Approval Object
```

### **Key Limitations**
- **Cross-object dependencies** between Contact and HJ Approval
- **Parameter duplication** across multiple objects
- **Fragile references** when objects merge
- **Complex property mapping** between objects

---

*This analysis confirms that our sprint plan needs to be revised to start from the Contact object level, not the HJ Approval level, as the approval workflows are triggered by Contact object changes, not HJ Approval object changes.*
