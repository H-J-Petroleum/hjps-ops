# Request for Approval Sub-Process

*Child process within the approval workflow - handles timesheet submission and approval request creation*

## 🎯 **Process Purpose**

This sub-process handles the initial submission of timesheets for approval:
1. **Timesheet Selection** - Consultant selects timesheets for approval
2. **Form Submission** - Submits approval request form
3. **Data Validation** - Validates timesheet and project data
4. **Workflow Trigger** - Triggers approval workflow (WF-13)
5. **Approval Creation** - Creates HJ Approval object

## 🔄 **Process Flow**

```
Timesheet Selection → Form Submission → Data Validation → Workflow Trigger → Approval Object Creation
```

## 📊 **Key Components**

### **Entry Points**
- **Timesheet Management Interface** - Main entry point
- **Project Selection** - Choose project for approval
- **Timesheet Selection** - Select specific timesheets

### **Data Processing**
- **Form Data Collection** - Gather all required approval data
- **Parameter Validation** - Validate project and timesheet data
- **Approver Determination** - Determine internal vs external approver
- **Workflow Preparation** - Prepare data for workflow processing

### **Outputs**
- **HJ Approval Object** - Created with all approval data
- **Workflow Enrollment** - Triggers approval workflow
- **Status Updates** - Updates timesheet status to "Submitted"

## 🔗 **Integration Points**

### **Previous Process**
- **Timesheet Creation** - [02_timesheet_creation/overview.md](../../02_timesheet_creation/overview.md)

### **Next Process**
- **Approve/Reject** - [approve_reject/overview.md](../approve_reject/overview.md)
- **Re-Approval Request** - [re_approval_request/overview.md](../re_approval_request/overview.md)

### **Related Processes**
- **Notifications** - [Notifications Summary](../../../../shared/notifications/TODO.md)
- **Billing** - [04_billing/overview.md](../../04_billing/overview.md)

## 📋 **Key Assets**

### **Forms**
- **Request for Approval Form** (5dd64adc-00b2-4cfa-a69f-4cb068c5c55f)

### **Modules**
- **Timesheet Management Module** (161468337269)

### **Workflows**
- **Consultant Approval Request** (567500453)

### **Objects**
- **Contact Object** (0-1) - Form target
- **HJ Approvals Object** (2-26103010) - Created by workflow

## 🚨 **Common Issues**

1. **Missing Project Data** - Project not properly configured
2. **Invalid Timesheet Data** - Timesheets missing required fields
3. **Approver Assignment** - No approver assigned to project
4. **Form Submission Errors** - Form validation failures

## 🎯 **Success Criteria**

- [ ] Timesheets are properly selected and validated
- [ ] Form submission is successful
- [ ] HJ Approval object is created
- [ ] Workflow is triggered correctly
- [ ] All stakeholders are notified

---

*This sub-process is the entry point for the approval workflow and must be robust and user-friendly.*
