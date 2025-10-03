# Workflow 567500453 - Consultant Approval Request

*Primary workflow for processing timesheet approval requests*

## 🎯 **Basic Information**

- **ID:** 567500453
- **Name:** Consultant Approval Request
- **HubSpot Link:** https://app.hubspot.com/workflows/1230608/platform/flow/567500453/edit
- **Local Files:** 
  - `data/raw/workflows/workflow-567500453-v4.json`
  - `data/raw/workflows/workflow-567500453-actions.json`
- **Status:** ✅ **ACTIVE** (isEnabled: true, revisionId: 53)
- **Last Updated:** 2025-09-05T12:49:29.951Z
- **Object Type:** Contact (0-1) ← **CRITICAL: This is the trigger target**

## 🎯 **Purpose & Function**

This workflow is triggered when a consultant submits timesheets for approval. It:
1. **Reads Contact properties** from the form submission
2. **Creates HJ Approval object** using Contact data as input
3. **Determines approver type** (`approver_is` property)
4. **Sends notifications** to appropriate approver
5. **Creates approval tasks** for tracking

## 🔗 **Cross-References**

### **Direct Dependencies**
- **Uses:** 
  - Contact Object (0-1) - trigger and data source
  - HJ Projects Object (2-118270518) - approver information
  - HJ Timesheets Object (2-26173281) - timesheet data
  - HJ Approvals Object (2-26103010) - creates this object
- **Used By:** 
  - Form: Request for Approval (5dd64adc-00b2-4cfa-a69f-4cb068c5c55f)
  - Module: hjp-insert-timesheet-06-my-timesheets
  - Workflows: Reminder 1 (567466561), Reminder 3 (567463273)

### **Process Flow**
- **Previous:** [Timesheet Creation Process](../02_timesheet_creation/overview.md)
- **Current:** Request for Approval → Workflow Processing
- **Next:** [Approval Interfaces](approval_interfaces/overview.md)

### **Related Assets**
- **Triggered By:** [form-5dd64adc-request-for-approval.md](forms/form-5dd64adc-request-for-approval.md)
- **Creates:** [object-2-26103010-hj-approvals.md](objects/object-2-26103010-hj-approvals.md)
- **Notifies:** [module-96920867313-external-approval-interface.md](modules/module-96920867313-external-approval-interface.md)

## 📊 **Technical Details**

### **Enrollment Criteria**
```json
{
  "objectType": "0-1",
  "enrollmentTriggers": ["contact"],
  "conditions": [
    {
      "property": "approval_timesheet_ids_array",
      "operator": "HAS_PROPERTY"
    }
  ]
}
```

### **Key Actions**
1. **Action 1:** Read Contact properties and determine approver type
2. **Action 2:** Create HJ Approval object with Contact data
3. **Action 3:** Send notification email to approver
4. **Action 4:** Create approval task for tracking
5. **Action 5:** Update timesheet status to "Submitted for Approval"

### **Branching Logic**
- **Internal Approvals:** `approver_is = "HJPetro"`
- **External Approvals:** `approver_is = "PrimaryContact"`

## 🚨 **Known Issues**

### **Current Issues**
1. **Parameter Synchronization:** Contact properties must match form submission exactly
2. **Cross-Object Dependencies:** Workflow depends on Contact properties as bridge
3. **Object Merging:** Contact merging can break approval references

### **Solutions Implemented**
1. **Parameter Validation:** Added checks for required Contact properties
2. **Error Handling:** Improved error messages for missing dependencies
3. **Reference Updates:** Added logic to update references after object merges

## 🤖 **Agent Notes**

### **Critical Points**
- **Contact is the trigger object** - not HJ Approval
- **Form submission updates Contact** - workflow reads Contact properties
- **Workflow creates HJ Approval** - using Contact data as input
- **Approver determination is critical** - affects routing logic

### **Common Tasks**
- **Debug Trigger Issues:** Check Contact properties and enrollment criteria
- **Modify Approval Logic:** Update branching conditions and actions
- **Add New Approver Types:** Extend routing logic for new scenarios
- **Fix Cross-References:** Update dependencies when related assets change

### **Testing Checklist**
- [ ] Verify Contact properties are populated before workflow
- [ ] Test both internal and external approval paths
- [ ] Check HJ Approval object creation
- [ ] Validate notification delivery
- [ ] Confirm timesheet status updates

---

*This workflow is the central processing engine for the approval process. Changes here affect the entire approval flow.*
