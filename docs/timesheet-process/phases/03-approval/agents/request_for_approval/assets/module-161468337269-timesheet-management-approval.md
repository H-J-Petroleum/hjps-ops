# Module 161468337269 - Timesheet Management & Approval

*Main module for timesheet management and approval request functionality*

## 🎯 **Basic Information**

- **ID:** 161468337269
- **Name:** Timesheet Management & Approval
- **HubSpot Link:** https://app.hubspot.com/design-manager/1230608/modules/161468337269
- **Local Files:** 
  - `data/raw/themes/Timesheets-Theme/modules/hjp-insert-timesheet-06-my-timesheets.module/module.html`
  - `data/raw/themes/Timesheets-Theme/modules/hjp-insert-timesheet-06-my-timesheets.module/meta.json`
- **Status:** ✅ **ACTIVE**
- **Content Types:** LANDING_PAGE, SITE_PAGE, BLOG_LISTING, BLOG_POST
- **Last Updated:** 2025-09-17

## 🎯 **Purpose & Function**

This module provides the main interface for timesheet management and approval requests. It:
1. **Displays all timesheets** for a selected project
2. **Provides filtering options** by status and sorting
3. **Contains the "Request For Approval" button** that triggers the approval process
4. **Manages timesheet operations** (view, edit, delete)
5. **Handles URL parameter passing** between modules

## 🔗 **Cross-References**

### **Direct Dependencies**
- **Uses:** 
  - HJ Timesheets Object (2-26173281) - displays timesheet data
  - HJ Projects Object (2-118270518) - project information
  - Contact Object (0-1) - consultant information
  - HJ Approvals Object (2-26103010) - approval data
- **Used By:** 
  - Landing Page: insert-timesheet-my-timesheets
  - Form: 5dd64adc (Request for Approval) - contains the form
  - Workflow: 567500453 (Consultant Approval Request) - triggered by form

### **Process Flow**
- **Previous:** [Timesheet Creation Process](../02_timesheet_creation/overview.md)
- **Current:** Timesheet Management & Approval Request
- **Next:** [Approval Processing](approval_processing/overview.md)

### **Related Assets**
- **Used On:** [landingpage-insert-timesheet-my-timesheets.md](../landingpages/landingpage-insert-timesheet-my-timesheets.md)
- **Contains:** [form-5dd64adc-request-for-approval.md](../forms/form-5dd64adc-request-for-approval.md)
- **Triggers:** [workflow-567500453-consultant-approval-request.md](../workflows/workflow-567500453-consultant-approval-request.md)

## 📊 **Technical Details**

### **URL Parameters**
- `consultant_id` → **Source:** `request.query_dict.consultant_id` (encrypted)
- `consultant_email` → **Source:** `request.query_dict.consultant_email`
- `consultant_name` → **Source:** `request.query_dict.consultant_name`
- `project_id` → **Source:** `request.query_dict.project_id`
- `timesheet_contact` → **Source:** `submit_as_pseudo_contact` (delegation)
- `email_to_submit` → **Source:** `submit_email` (delegation email)
- `line_item_status` → **Source:** User selection (filtering)
- `ordinal_number_order` → **Source:** User selection (sorting)

### **Key Functions**
1. **Timesheet Display:** Shows all timesheets for the project
2. **Status Filtering:** Filter by Created/Submitted/Approved/Rejected
3. **Sorting Options:** Sort by ordinal number (ascending/descending)
4. **Approval Request:** "Request For Approval" button functionality
5. **Timesheet Operations:** Edit, delete, and manage timesheets
6. **Parameter Passing:** Maintains URL parameters between modules

### **JavaScript Functions**
- `setStatusValue()` → Filter timesheets by status
- `setOrderBy()` → Sort timesheets by ordinal number
- `requestForApproval()` → Submit timesheets for approval
- `backToMyProjects()` → Return to project selection
- `anotherLineItem()` → Create new timesheet entry

## 🚨 **Known Issues**

### **Current Issues**
1. **Parameter Dependencies:** Module depends on URL parameters from previous modules
2. **Delegation Logic:** Complex logic for timesheet contact delegation
3. **Performance:** Large numbers of timesheets can slow down the interface

### **Solutions Implemented**
1. **Parameter Validation:** Check required parameters before processing
2. **Delegation Handling:** Proper logic for timesheet contact delegation
3. **Pagination:** Limit timesheet display for better performance

## 🤖 **Agent Notes**

### **Critical Points**
- **Main approval interface** - contains the "Request For Approval" button
- **Parameter dependent** - requires URL parameters from previous modules
- **Delegation logic** - handles timesheet contact delegation
- **Form integration** - contains the approval request form

### **Common Tasks**
- **Debug Parameter Issues:** Check URL parameter passing
- **Fix Delegation Logic:** Resolve timesheet contact delegation problems
- **Update Filtering:** Modify timesheet filtering and sorting
- **Optimize Performance:** Improve interface performance

### **Testing Checklist**
- [ ] Verify URL parameter handling
- [ ] Test timesheet filtering and sorting
- [ ] Check "Request For Approval" functionality
- [ ] Validate delegation logic
- [ ] Confirm form integration

---

*This module is the central interface for timesheet management and approval requests. Changes here affect the entire approval process.*
