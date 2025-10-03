# Object 2-26103010 - HJ Approvals

*Custom object for storing timesheet approval data*

## 🎯 **Basic Information**

- **ID:** 2-26103010
- **Name:** HJ Approvals
- **HubSpot Link:** https://app.hubspot.com/settings/1230608/objects/2-26103010
- **Local Files:** 
  - `data/raw/ai-context/ai-context-export/data-model/hj_approvals_schema.json`
  - `data/raw/ai-context/ai-context-export/data-model/hj_approvals-schema-2-26103010.json`
- **Status:** ✅ **ACTIVE**
- **Object Type:** Custom Object
- **Last Updated:** 2025-09-17

## 🎯 **Purpose & Function**

This custom object stores all timesheet approval data and serves as the central record for approval processes. It:
1. **Stores approval request data** from form submissions
2. **Tracks approval status** throughout the process
3. **Links to related timesheets** and projects
4. **Maintains approval history** and audit trail
5. **Enables workflow processing** and automation

## 🔗 **Cross-References**

### **Direct Dependencies**
- **Uses:** 
  - HJ Timesheets Object (2-26173281) - links to timesheet records
  - HJ Projects Object (2-118270518) - project information
  - Contact Object (0-1) - consultant and approver information
  - Deal Object (0-3) - project details
- **Used By:** 
  - Workflow: 567500453 (Consultant Approval Request) - creates records
  - Workflow: 567466561 (Reminder 1) - reads and updates
  - Workflow: 567463273 (Reminder 3) - reads and updates
  - Workflow: 1680618036 (Customer Approval Response) - updates
  - Workflow: 1682422902 (H&J Approval Response) - updates

### **Process Flow**
- **Created By:** [workflow-567500453-consultant-approval-request.md](../workflows/workflow-567500453-consultant-approval-request.md)
- **Updated By:** [workflow-567466561-reminder-1.md](../workflows/workflow-567466561-reminder-1.md)
- **Finalized By:** [workflow-1680618036-customer-approval-response.md](../workflows/workflow-1680618036-customer-approval-response.md)

### **Related Assets**
- **Created By:** [workflow-567500453-consultant-approval-request.md](../workflows/workflow-567500453-consultant-approval-request.md)
- **Updated By:** [workflow-567466561-reminder-1.md](../workflows/workflow-567466561-reminder-1.md)
- **Finalized By:** [workflow-1680618036-customer-approval-response.md](../workflows/workflow-1680618036-customer-approval-response.md)

## 📊 **Technical Details**

### **Key Properties**
- `approval_status` → **Type:** Single-line text, **Values:** Pending/Approved/Rejected
- `approval_timesheet_ids_array` → **Type:** Single-line text, **Values:** Comma-separated timesheet IDs
- `approval_project_id` → **Type:** Single-line text, **Values:** Project ID
- `approval_consultant_name` → **Type:** Single-line text, **Values:** Consultant full name
- `approver_full_name` → **Type:** Single-line text, **Values:** Approver name
- `approver_email` → **Type:** Single-line text, **Values:** Approver email
- `approver_is` → **Type:** Single-line text, **Values:** HJPetro/PrimaryContact
- `approval_from_date` → **Type:** Date, **Values:** Start date of timesheet period
- `approval_until_date` → **Type:** Date, **Values:** End date of timesheet period
- `approval_processed_date` → **Type:** Date, **Values:** Date approval was processed
- `approval_wells` → **Type:** Single-line text, **Values:** Well names
- `send_approval_consultant_name` → **Type:** Single-line text, **Values:** Consultant name for notifications
- `send_approval_from_date` → **Type:** Date, **Values:** Start date for notifications
- `send_approval_until_date` → **Type:** Date, **Values:** End date for notifications
- `send_approval_well_names` → **Type:** Single-line text, **Values:** Well names for notifications
- `send_approval_customer` → **Type:** Single-line text, **Values:** Customer name
- `send_approval_operator` → **Type:** Single-line text, **Values:** Operator name
- `send_approval_customer_email` → **Type:** Single-line text, **Values:** Customer email
- `send_approval_sales_deal_owner_name` → **Type:** Single-line text, **Values:** Deal owner name
- `send_approval_project_name` → **Type:** Single-line text, **Values:** Project name
- `send_approval_approver_name` → **Type:** Single-line text, **Values:** Approver name
- `reminder_1_sent` → **Type:** Single-line text, **Values:** Yes/No
- `reminder_3_sent` → **Type:** Single-line text, **Values:** Yes/No
- `escalation_flag` → **Type:** Single-line text, **Values:** Yes/No

### **Object Associations**
- **HJ Timesheets:** One-to-many relationship via `approval_timesheet_ids_array`
- **HJ Projects:** Many-to-one relationship via `approval_project_id`
- **Contact:** Many-to-one relationship via consultant and approver information
- **Deal:** Many-to-one relationship via project association

## 🚨 **Known Issues**

### **Current Issues**
1. **Property Duplication:** Some properties are duplicated for notification purposes
2. **Data Synchronization:** Properties must stay in sync with related objects
3. **Status Management:** Approval status must be accurately maintained

### **Solutions Implemented**
1. **Property Mapping:** Clear mapping between source and notification properties
2. **Validation Rules:** Ensure data consistency across properties
3. **Status Tracking:** Comprehensive status tracking and audit trail

## 🤖 **Agent Notes**

### **Critical Points**
- **Central approval record** - all approval data stored here
- **Status tracking** - approval status must be accurate
- **Property synchronization** - notification properties must stay in sync
- **Workflow dependent** - created and updated by workflows

### **Common Tasks**
- **Debug Status Issues:** Check approval status and property values
- **Fix Data Synchronization:** Ensure properties stay in sync
- **Update Property Mapping:** Modify property relationships
- **Test Workflow Integration:** Verify workflow updates work correctly

### **Testing Checklist**
- [ ] Verify object creation by workflows
- [ ] Check property updates and synchronization
- [ ] Test status tracking and audit trail
- [ ] Validate object associations
- [ ] Confirm workflow integration

---

*This object is the central record for all approval processes. Changes here affect the entire approval workflow.*
