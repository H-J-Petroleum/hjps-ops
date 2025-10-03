# Workflow 567466561 - Reminder 1 (Consultant Approval Request)

*First reminder workflow for pending approval requests*

## 🎯 **Basic Information**

- **ID:** 567466561
- **Name:** Reminder 1 - Consultant Approval Request
- **HubSpot Link:** https://app.hubspot.com/workflows/1230608/platform/flow/567466561/edit
- **Local Files:** 
  - `data/raw/workflows/workflow-567466561-v4.json`
  - `data/raw/workflows/workflow-567466561-actions.json`
- **Status:** ✅ **ACTIVE** (isEnabled: true)
- **Last Updated:** 2025-09-05T12:49:29.951Z
- **Object Type:** HJ Approvals (2-26103010) ← **Targets HJ Approval object**

## 🎯 **Purpose & Function**

This workflow sends the first reminder for pending approval requests. It:
1. **Triggers 1 day after** approval request creation
2. **Checks approval status** to ensure it's still pending
3. **Sends reminder email** to the appropriate approver
4. **Creates follow-up task** for tracking
5. **Updates reminder status** in the approval record

## 🔗 **Cross-References**

### **Direct Dependencies**
- **Uses:** 
  - HJ Approvals Object (2-26103010) - trigger and data source
  - Contact Object (0-1) - approver information
  - HJ Projects Object (2-118270518) - project details
- **Used By:** 
  - Workflow: 567500453 (Consultant Approval Request) - creates approval record
  - Workflow: 567463273 (Reminder 3) - follows this workflow

### **Process Flow**
- **Previous:** [workflow-567500453-consultant-approval-request.md](workflow-567500453-consultant-approval-request.md)
- **Current:** First Reminder (1 day after approval request)
- **Next:** [workflow-567463273-reminder-3.md](workflow-567463273-reminder-3.md)

### **Related Assets**
- **Triggered By:** [workflow-567500453-consultant-approval-request.md](workflow-567500453-consultant-approval-request.md)
- **Follows:** [workflow-567463273-reminder-3.md](workflow-567463273-reminder-3.md)
- **Notifies:** [module-96920867313-external-approval-interface.md](../modules/module-96920867313-external-approval-interface.md)

## 📊 **Technical Details**

### **Enrollment Criteria**
```json
{
  "objectType": "2-26103010",
  "enrollmentTriggers": ["hj_approvals"],
  "conditions": [
    {
      "property": "approval_status",
      "operator": "EQUAL",
      "value": "Pending"
    },
    {
      "property": "hs_createdate",
      "operator": "LESS_THAN",
      "value": "1 day ago"
    }
  ]
}
```

### **Key Actions**
1. **Action 1:** Check approval status (must be "Pending")
2. **Action 2:** Get approver information from related Contact
3. **Action 3:** Send reminder email to approver
4. **Action 4:** Create follow-up task for tracking
5. **Action 5:** Update reminder status in approval record

### **Reminder Logic**
- **Trigger Time:** 1 day after approval request creation
- **Condition:** Approval status must still be "Pending"
- **Recipients:** Based on `approver_is` field (Internal/External)
- **Content:** Includes approval details and direct approval link

## 🚨 **Known Issues**

### **Current Issues**
1. **Timing Sensitivity:** Must trigger exactly 1 day after creation
2. **Status Dependencies:** Relies on approval status being accurate
3. **Email Delivery:** Depends on approver email being valid

### **Solutions Implemented**
1. **Status Validation:** Added checks to ensure approval is still pending
2. **Email Validation:** Verify approver email before sending
3. **Fallback Logic:** Handle cases where approver information is missing

## 🤖 **Agent Notes**

### **Critical Points**
- **Targets HJ Approval object** - not Contact
- **Timing is critical** - must trigger exactly 1 day after creation
- **Status validation** - only sends if approval is still pending
- **Email delivery** - depends on valid approver email

### **Common Tasks**
- **Debug Timing Issues:** Check enrollment criteria and trigger timing
- **Fix Email Delivery:** Verify approver email and email templates
- **Update Reminder Content:** Modify email content and task details
- **Adjust Timing:** Change reminder schedule if needed

### **Testing Checklist**
- [ ] Verify workflow triggers 1 day after approval creation
- [ ] Check approval status validation logic
- [ ] Test email delivery to approvers
- [ ] Confirm task creation and tracking
- [ ] Validate reminder status updates

---

*This workflow is part of the reminder sequence that ensures approval requests don't get lost or forgotten.*
