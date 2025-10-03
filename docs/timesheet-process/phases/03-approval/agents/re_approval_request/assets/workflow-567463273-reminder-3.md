# Workflow 567463273 - Reminder 3 (Consultant Approval Request)

*Final reminder workflow for pending approval requests*

## 🎯 **Basic Information**

- **ID:** 567463273
- **Name:** Reminder 3 - Consultant Approval Request
- **HubSpot Link:** https://app.hubspot.com/workflows/1230608/platform/flow/567463273/edit
- **Local Files:** 
  - `data/raw/workflows/workflow-567463273-v4.json`
  - `data/raw/workflows/workflow-567463273-actions.json`
- **Status:** ✅ **ACTIVE** (isEnabled: true)
- **Last Updated:** 2025-09-05T12:49:29.951Z
- **Object Type:** HJ Approvals (2-26103010) ← **Targets HJ Approval object**

## 🎯 **Purpose & Function**

This workflow sends the final reminder for pending approval requests. It:
1. **Triggers 3 days after** approval request creation
2. **Checks approval status** to ensure it's still pending
3. **Sends urgent reminder email** to the appropriate approver
4. **Creates high-priority task** for immediate attention
5. **Updates reminder status** and escalates if needed
6. **Notifies project stakeholders** of delayed approval

## 🔗 **Cross-References**

### **Direct Dependencies**
- **Uses:** 
  - HJ Approvals Object (2-26103010) - trigger and data source
  - Contact Object (0-1) - approver information
  - HJ Projects Object (2-118270518) - project details
  - Deal Object (0-3) - project owner information
- **Used By:** 
  - Workflow: 567466561 (Reminder 1) - precedes this workflow
  - Approval Response Workflows - may be triggered after this

### **Process Flow**
- **Previous:** [workflow-567466561-reminder-1.md](workflow-567466561-reminder-1.md)
- **Current:** Final Reminder (3 days after approval request)
- **Next:** [workflow-1680618036-customer-approval-response.md](workflow-1680618036-customer-approval-response.md)

### **Related Assets**
- **Follows:** [workflow-567466561-reminder-1.md](workflow-567466561-reminder-1.md)
- **Notifies:** [module-96920867313-external-approval-interface.md](../modules/module-96920867313-external-approval-interface.md)
- **Escalates To:** Project owners and stakeholders

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
      "value": "3 days ago"
    },
    {
      "property": "reminder_1_sent",
      "operator": "EQUAL",
      "value": "Yes"
    }
  ]
}
```

### **Key Actions**
1. **Action 1:** Check approval status (must be "Pending")
2. **Action 2:** Verify Reminder 1 was sent
3. **Action 3:** Get approver and project information
4. **Action 4:** Send urgent reminder email to approver
5. **Action 5:** Create high-priority task for immediate attention
6. **Action 6:** Notify project owner of delayed approval
7. **Action 7:** Update reminder status and escalation flag

### **Escalation Logic**
- **Urgent Priority:** Tasks marked as high priority
- **Stakeholder Notification:** Project owners are notified
- **Escalation Flag:** Sets flag for potential manual intervention
- **Content:** Emphasizes urgency and potential project delays

## 🚨 **Known Issues**

### **Current Issues**
1. **Escalation Management:** No automatic escalation beyond this point
2. **Stakeholder Notification:** Depends on accurate project owner information
3. **Manual Intervention:** May require manual follow-up for stuck approvals

### **Solutions Implemented**
1. **Escalation Flags:** Added flags to identify stuck approvals
2. **Stakeholder Alerts:** Notify project owners of delays
3. **Priority Tasks:** Create high-priority tasks for immediate attention
4. **Status Tracking:** Enhanced tracking of reminder sequence

## 🤖 **Agent Notes**

### **Critical Points**
- **Final reminder** - no automatic escalation beyond this
- **Escalation triggers** - may require manual intervention
- **Stakeholder notification** - alerts project owners
- **High priority** - tasks marked for immediate attention

### **Common Tasks**
- **Debug Escalation Issues:** Check stakeholder notification logic
- **Fix Stuck Approvals:** Manual intervention for long-pending approvals
- **Update Escalation Logic:** Modify escalation triggers and notifications
- **Adjust Timing:** Change final reminder schedule if needed

### **Testing Checklist**
- [ ] Verify workflow triggers 3 days after approval creation
- [ ] Check escalation logic and stakeholder notifications
- [ ] Test high-priority task creation
- [ ] Confirm escalation flag updates
- [ ] Validate reminder sequence completion

---

*This workflow represents the final automated step in the reminder sequence. Beyond this point, manual intervention may be required.*
