# Re-Approval Request Sub-Process

*Child process within the approval workflow - handles resubmission of rejected timesheets*

## 🎯 **Process Purpose**

This sub-process handles the resubmission of rejected timesheets:
1. **Rejection Processing** - Handle rejected timesheet notifications
2. **Resubmission Interface** - Allow consultant to resubmit
3. **Data Updates** - Update timesheet data based on feedback
4. **Re-Approval Submission** - Submit updated timesheets for approval
5. **Workflow Restart** - Restart approval workflow

## 🔄 **Process Flow**

```
Rejection Notification → Resubmission Interface → Data Updates → Re-Approval Submission → Workflow Restart
```

## 📊 **Key Components**

### **Rejection Handling**
- **Rejection Notifications** - Notify consultant of rejection
- **Feedback Processing** - Process rejection comments
- **Status Updates** - Update timesheet status to "Rejected"
- **Resubmission Preparation** - Prepare for resubmission

### **Resubmission Interface**
- **Updated Timesheet Display** - Show rejected timesheets
- **Feedback Display** - Show rejection comments
- **Edit Interface** - Allow timesheet modifications
- **Resubmission Form** - Submit updated timesheets

### **Re-Approval Processing**
- **Data Validation** - Validate updated timesheet data
- **Approval Recreation** - Create new approval request
- **Workflow Trigger** - Restart approval workflow
- **Notification Sending** - Notify approver of resubmission

## 🔗 **Integration Points**

### **Previous Process**
- **Approve/Reject** - [approve_reject/overview.md](../approve_reject/overview.md) (rejection decision)

### **Next Process**
- **Approve/Reject** - [approve_reject/overview.md](../approve_reject/overview.md) (new approval decision)
- **Billing Process** - [04_billing/overview.md](../../04_billing/overview.md) (if approved)

### **Related Processes**
- **Notifications** - [Notifications Summary](../../../../shared/notifications/TODO.md)
- **Status Tracking** - Timesheet status updates

## 📋 **Key Assets**

### **Forms**
- **Re-Approval Request Form** (f45d58de-38c3-441e-b344-2e6c6187b272)

### **Modules**
- **Re-Approval Interface Module** (TBD)

### **Workflows**
- **Re-Approval Workflow** (TBD)

### **Objects**
- **HJ Approvals Object** (2-26103010) - New approval created
- **HJ Timesheets Object** (2-26173281) - Updated with changes

## 🚨 **Common Issues**

1. **Rejection Notifications** - Consultant not notified of rejection
2. **Resubmission Interface** - Interface not loading correctly
3. **Data Updates** - Timesheet data not updating
4. **Workflow Restart** - Approval workflow not restarting

## 🎯 **Success Criteria**

- [ ] Rejection notifications are sent
- [ ] Resubmission interface works correctly
- [ ] Timesheet data can be updated
- [ ] Re-approval submission is successful
- [ ] Approval workflow restarts properly

---

*This sub-process handles the iterative nature of the approval process when timesheets are rejected.*
