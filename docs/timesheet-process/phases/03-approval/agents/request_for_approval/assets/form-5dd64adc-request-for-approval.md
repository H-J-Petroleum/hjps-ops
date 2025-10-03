# Form 5dd64adc - Request for Approval

*Primary form for submitting timesheet approval requests*

## 🎯 **Basic Information**

- **ID:** 5dd64adc-00b2-4cfa-a69f-4cb068c5c55f
- **Name:** Request for Approval (Timesheet Approval Submission)
- **HubSpot Link:** https://app.hubspot.com/forms/1230608/editor/5dd64adc-00b2-4cfa-a69f-4cb068c5c55f/edit
- **Local Files:** 
  - `data/raw/ai-context/ai-context-export/forms/request-for-approval.json`
  - `data/raw/themes/Timesheets-Theme/modules/hjp-line-items-approval-01.module/module.html`
- **Status:** ✅ **ACTIVE**
- **Target Object:** Contact (0-1) ← **CRITICAL: Form targets Contact, not HJ Approval**
- **Last Updated:** 2025-09-17

## 🎯 **Purpose & Function**

This form is used by consultants to submit timesheet approval requests. It:
1. **Collects approval data** from the timesheet management interface
2. **Updates Contact properties** with form submission data
3. **Triggers Workflow 13** (Consultant Approval Request)
4. **Creates approval request record** in the system

## 🔗 **Cross-References**

### **Direct Dependencies**
- **Uses:** 
  - Contact Object (0-1) - target object for form submission
  - HJ Projects Object (2-118270518) - approver information
  - HJ Timesheets Object (2-26173281) - timesheet data
- **Used By:** 
  - Module: hjp-insert-timesheet-06-my-timesheets
  - Module: hjp-line-items-approval-01
  - Workflow: 567500453 (Consultant Approval Request)

### **Process Flow**
- **Previous:** [Timesheet Management Interface](modules/module-161468337269-timesheet-management-approval.md)
- **Current:** Form Submission → Contact Properties Updated
- **Next:** [Workflow 567500453](workflows/workflow-567500453-consultant-approval-request.md)

### **Related Assets**
- **Triggered From:** [module-161468337269-timesheet-management-approval.md](modules/module-161468337269-timesheet-management-approval.md)
- **Triggers:** [workflow-567500453-consultant-approval-request.md](workflows/workflow-567500453-consultant-approval-request.md)
- **Contains:** [module-96920867313-external-approval-interface.md](modules/module-96920867313-external-approval-interface.md)

## 📊 **Technical Details**

### **Form Fields (Complete List)**
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

### **Special Field Notes**
- **`quote_customer_name`** → **MISLEADING NAME** - Actually stores sequential approval number (0001, 0002, etc.)
- **`submitted_as_timesheet_contact`** → **LEGACY FIELD** - Designed for form-based workflows, will be deprecated with direct object writes
- **`approval_timesheet_ids_array`** → Populated by JavaScript collecting selected timesheet IDs from UI

### **Form Configuration**
- **Submission Method:** POST
- **Target Object:** Contact (0-1)
- **Validation:** Client-side and server-side validation
- **Error Handling:** Custom error messages for validation failures

## 🚨 **Known Issues**

### **Current Issues**
1. **Target Object Confusion:** Form targets Contact (0-1), not HJ Approval as originally assumed
2. **Parameter Dependencies:** Form depends on URL parameters passed from previous modules
3. **Field Name Confusion:** `quote_customer_name` is misleading (stores approval number)
4. **Legacy Fields:** `submitted_as_timesheet_contact` is deprecated but still used

### **Solutions Implemented**
1. **Corrected Target Object:** Updated documentation to reflect Contact (0-1) target
2. **Parameter Validation:** Added checks for required URL parameters
3. **Field Documentation:** Clarified misleading field names and purposes
4. **Legacy Field Handling:** Documented deprecation path for legacy fields

## 🤖 **Agent Notes**

### **Critical Points**
- **Form targets Contact object** - not HJ Approval
- **Workflow creates HJ Approval** - using Contact properties as input
- **URL parameters are critical** - form depends on them for data
- **Field names can be misleading** - check actual content, not names

### **Common Tasks**
- **Debug Form Submission:** Check target object and field mappings
- **Modify Form Fields:** Update field sources and validation
- **Fix Parameter Issues:** Ensure URL parameters reach the form
- **Update Field Names:** Rename misleading fields for clarity

### **Testing Checklist**
- [ ] Verify form targets Contact object (0-1)
- [ ] Check all form fields are populated correctly
- [ ] Test form submission with valid data
- [ ] Validate error handling for missing data
- [ ] Confirm workflow trigger after submission

---

*This form is the critical entry point for the approval process. Changes here affect the entire approval workflow.*
