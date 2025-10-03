# Workflow Sequence Documentation

*Complete workflow sequence and dependencies for the approval process*

## 🎯 **Workflow Overview**

The approval process consists of 5 interconnected workflows that handle the complete lifecycle from request submission to final approval response.

## 🔄 **Workflow Sequence**

### **1. Workflow 567500453 - Consultant Approval Request**
- **Trigger:** Contact object property changes
- **Purpose:** Creates approval request and determines routing
- **Output:** HJ Approvals object created
- **Next:** Triggers reminder workflows

### **2. Workflow 567466561 - Reminder 1**
- **Trigger:** HJ Approvals object (1 day after creation)
- **Purpose:** First reminder for pending approvals
- **Output:** Reminder email sent, task created
- **Next:** Workflow 567463273 (Reminder 3)

### **3. Workflow 567463273 - Reminder 3**
- **Trigger:** HJ Approvals object (3 days after creation)
- **Purpose:** Final reminder for pending approvals
- **Output:** Urgent reminder, escalation task
- **Next:** Manual intervention or approval response

### **4. Workflow 1680618036 - Customer Approval Response**
- **Trigger:** External approval form submission
- **Purpose:** Processes external customer approval responses
- **Output:** Timesheet status updates, notifications
- **Next:** Billing process

### **5. Workflow 1682422902 - H&J Approval Response**
- **Trigger:** Internal approval form submission
- **Purpose:** Processes internal H&J staff approval responses
- **Output:** Timesheet status updates, notifications
- **Next:** Billing process

## 📊 **Workflow Dependencies**

### **High Dependencies**
- **567500453** → **567466561** (Creates approval record for reminders)
- **567466561** → **567463273** (Reminder sequence)
- **567500453** → **1680618036/1682422902** (Creates approval for response)

### **Medium Dependencies**
- **567500453** → **All Modules** (Provides approval data)
- **1680618036/1682422902** → **Timesheet Objects** (Updates status)

### **Low Dependencies**
- **567463273** → **Manual Intervention** (Escalation)
- **All Workflows** → **Notification System** (Email delivery)

## 🚨 **Critical Workflow Points**

### **1. Contact Object Trigger (567500453)**
- **Critical:** Must have all required Contact properties
- **Issue:** Missing properties cause workflow failure
- **Solution:** Validate Contact properties before workflow

### **2. Approval Routing Logic (567500453)**
- **Critical:** `approver_is` property determines routing
- **Issue:** Wrong routing causes approval to wrong interface
- **Solution:** Validate approver type before routing

### **3. Reminder Timing (567466561, 567463273)**
- **Critical:** Must trigger at exact time intervals
- **Issue:** Timing issues cause missed reminders
- **Solution:** Use HubSpot's built-in delay actions

### **4. Status Synchronization (1680618036, 1682422902)**
- **Critical:** All related objects must stay in sync
- **Issue:** Partial updates cause data inconsistency
- **Solution:** Use batch updates and rollback logic

## 🔧 **Workflow Configuration**

### **Enrollment Criteria**
```json
{
  "567500453": {
    "objectType": "0-1",
    "conditions": [
      {"property": "approval_timesheet_ids_array", "operator": "HAS_PROPERTY"}
    ]
  },
  "567466561": {
    "objectType": "2-26103010", 
    "conditions": [
      {"property": "approval_status", "operator": "EQUAL", "value": "Pending"},
      {"property": "hs_createdate", "operator": "LESS_THAN", "value": "1 day ago"}
    ]
  }
}
```

### **Action Sequences**
- **567500453:** Read Contact → Create HJ Approval → Send Notification → Create Task
- **567466561:** Check Status → Send Reminder → Create Task → Update Flag
- **567463273:** Check Status → Send Urgent Reminder → Create Escalation Task
- **1680618036/1682422902:** Validate Response → Update Status → Update Timesheets → Send Notifications

## 📋 **Testing Checklist**

### **Workflow Trigger Testing**
- [ ] Test Contact property changes trigger 567500453
- [ ] Verify HJ Approval creation triggers reminders
- [ ] Check approval form submission triggers response workflows
- [ ] Test timing-based triggers for reminders

### **Workflow Logic Testing**
- [ ] Test internal vs external routing logic
- [ ] Verify reminder sequence timing
- [ ] Check status update logic
- [ ] Test error handling and rollback

### **Integration Testing**
- [ ] Test complete approval flow end-to-end
- [ ] Verify cross-workflow data consistency
- [ ] Check notification delivery
- [ ] Test escalation scenarios

## 🔍 Internal vs External Approval Diff (WF-26 vs WF-21)

Use this quick comparison when diagnosing internal approvals:
- **WF-26 extra branch:** Action 7 checks `'consultant_field_ticket_url'` and clears it in action 11; WF-21 proceeds without this gate.
- **Contact associations:** WF-21 keeps a marketing opt-in step (action 17) after associating approver/consultant; WF-26 skips it and loops directly after actions 14/15/16.
- **Retry cadence:** WF-21 delays 1 minute before entering a five-webhook ladder with 10/30/60/120-minute retries (actions 25/35/38/45 plus follow-ups). WF-26 delays 10 minutes and runs only four webhooks (17/31/36/40) with shorter back-offs and no final 120-minute pass.
- **Error handling:** WF-21 sets `webbook_error` at action 23 and uses action 24 to branch; WF-26 sets it at action 20 and branches via action 21, skipping the extended ladder.
- **Owner notification:** WF-21 finishes with actions 45–51 to alert the owner if retries fail; WF-26 has no equivalent cleanup step.

Full write-up: `analysis/issues/2025-09-22-internal-approval-workflow-broken/WF-21-vs-WF-26-diff.md`.

---

*This documentation provides the complete workflow sequence and dependencies for the approval process.*
