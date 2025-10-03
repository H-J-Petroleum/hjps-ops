# Form 31f4d567 - External Approval Response

*Form for external customers to respond to approval requests*

## 🎯 **Basic Information**

- **ID:** 31f4d567-ae0d-4ed2-8d4d-9701b127753a
- **Name:** External Approval Response
- **HubSpot Link:** https://app.hubspot.com/forms/1230608/editor/31f4d567-ae0d-4ed2-8d4d-9701b127753a/edit
- **Local Files:** 
  - `data/raw/ai-context/ai-context-export/forms/external-approval-response.json`
  - `data/raw/themes/Timesheets-Theme/modules/hjp-field-ticket-for-approval-01.module/module.html`
- **Status:** ✅ **ACTIVE**
- **Target Object:** HJ Approvals (2-26103010) ← **Targets HJ Approval object**
- **Last Updated:** 2025-09-17

## 🎯 **Purpose & Function**

This form is used by external customers to respond to timesheet approval requests. It:
1. **Displays approval details** including timesheet information
2. **Collects approval decision** (Approve/Reject) from customer
3. **Updates HJ Approval object** with response data
4. **Triggers approval processing workflow** for status updates
5. **Sends confirmation** to consultant and stakeholders

## 🔗 **Cross-References**

### **Direct Dependencies**
- **Uses:** 
  - HJ Approvals Object (2-26103010) - target object for form submission
  - HJ Timesheets Object (2-26173281) - displays timesheet details
  - HJ Projects Object (2-118270518) - project information
  - Contact Object (0-1) - customer information
- **Used By:** 
  - Module: hjp-field-ticket-for-approval-01 (External Approval Interface)
  - Workflow: 1680618036 (Customer Approval Response)

### **Process Flow**
- **Previous:** [workflow-567500453-consultant-approval-request.md](../workflows/workflow-567500453-consultant-approval-request.md)
- **Current:** External Customer Approval Response
- **Next:** [workflow-1680618036-customer-approval-response.md](../workflows/workflow-1680618036-customer-approval-response.md)

### **Related Assets**
- **Contained In:** [module-96920867313-external-approval-interface.md](../modules/module-96920867313-external-approval-interface.md)
- **Triggers:** [workflow-1680618036-customer-approval-response.md](../workflows/workflow-1680618036-customer-approval-response.md)
- **Displays:** [object-2-26173281-hj-timesheets.md](../objects/object-2-26173281-hj-timesheets.md)

## 📊 **Technical Details**

### **Form Fields (Complete List)**
- `approval_id` → **Source:** URL parameter from approval link
- `approval_decision` → **Source:** User selection (Approve/Reject)
- `approval_comments` → **Source:** User input (optional comments)
- `approver_name` → **Source:** Pre-populated from approval record
- `approver_email` → **Source:** Pre-populated from approval record
- `approval_date` → **Source:** Current date/time
- `timesheet_ids` → **Source:** Pre-populated from approval record
- `project_id` → **Source:** Pre-populated from approval record
- `customer_name` → **Source:** Pre-populated from approval record

### **Form Configuration**
- **Submission Method:** POST
- **Target Object:** HJ Approvals (2-26103010)
- **Validation:** Client-side and server-side validation
- **Error Handling:** Custom error messages for validation failures

### **Approval Logic**
- **Approve:** Sets approval status to "Approved"
- **Reject:** Sets approval status to "Rejected"
- **Comments:** Optional feedback for consultant
- **Confirmation:** Sends confirmation email to all stakeholders

## 🚨 **Known Issues**

### **Current Issues**
1. **URL Parameter Dependencies:** Form depends on approval ID in URL
2. **Data Pre-population:** Requires accurate approval record data
3. **Email Delivery:** Depends on valid email addresses for notifications

### **Solutions Implemented**
1. **Parameter Validation:** Check approval ID exists and is valid
2. **Data Verification:** Validate approval record before display
3. **Email Validation:** Verify email addresses before sending notifications

## 🤖 **Agent Notes**

### **Critical Points**
- **Targets HJ Approval object** - not Contact
- **URL parameter dependent** - requires approval ID in URL
- **External customer interface** - different from internal approvals
- **Approval decision is final** - no undo mechanism

### **Common Tasks**
- **Debug Form Submission:** Check target object and field mappings
- **Fix URL Parameter Issues:** Ensure approval ID is passed correctly
- **Update Form Fields:** Modify form fields and validation
- **Test Approval Logic:** Verify approve/reject functionality

### **Testing Checklist**
- [ ] Verify form targets HJ Approval object (2-26103010)
- [ ] Check URL parameter handling for approval ID
- [ ] Test approve/reject functionality
- [ ] Validate email notifications
- [ ] Confirm workflow trigger after submission

---

*This form is the critical interface for external customer approvals. Changes here affect the entire external approval process.*
