# 🔧 Technical Specification - New Approval Architecture

*Detailed technical specifications for the redesigned approval system*

## 🎯 **System Architecture Overview**

### **Core Design Principles**
- **Direct Object Writes:** Eliminate form dependencies
- **Modular Code:** Shared logic across all components
- **Unified Interfaces:** Single pages for complex operations
- **Minimal Workflows:** Use only when complexity requires
- **Real-time Updates:** Immediate feedback and status updates

## 🏗️ **Component Architecture**

### **1. Approver Dashboard Module**
```javascript
// Module: hjp-approver-dashboard
const ApproverDashboard = {
  // Core Components
  components: {
    ApprovalList: 'approval-list-component',
    ApprovalDetail: 'approval-detail-component',
    BulkOperations: 'bulk-operations-component',
    FilterPanel: 'filter-panel-component'
  },
  
  // Shared Logic
  logic: {
    loadApprovals: 'shared-approval-logic.loadApprovals',
    processApproval: 'shared-approval-logic.processApproval',
    updateStatus: 'shared-approval-logic.updateStatus'
  },
  
  // Direct Object Access
  objects: {
    read: ['hj_approvals', 'hj_timesheets', 'hj_projects'],
    write: ['hj_approvals', 'hj_timesheets']
  }
};
```

### **2. Project Setup Module**
```javascript
// Module: hjp-project-setup
const ProjectSetup = {
  // Core Components
  components: {
    ProjectForm: 'project-form-component',
    ApproverAssignment: 'approver-assignment-component',
    AssociationManager: 'association-manager-component',
    SettingsPanel: 'settings-panel-component'
  },
  
  // Shared Logic
  logic: {
    createProject: 'shared-project-logic.createProject',
    assignApprover: 'shared-project-logic.assignApprover',
    setupAssociations: 'shared-project-logic.setupAssociations'
  },
  
  // Direct Object Access
  objects: {
    read: ['hj_projects', 'contacts', 'companies'],
    write: ['hj_projects', 'contacts', 'companies']
  }
};
```

### **3. Timesheet Management Module**
```javascript
// Module: hjp-timesheet-management
const TimesheetManagement = {
  // Core Components
  components: {
    TimesheetList: 'timesheet-list-component',
    SelectionPanel: 'selection-panel-component',
    ApprovalSubmission: 'approval-submission-component',
    StatusTracker: 'status-tracker-component'
  },
  
  // Shared Logic
  logic: {
    getTimesheets: 'shared-timesheet-logic.getTimesheets',
    selectTimesheets: 'shared-timesheet-logic.selectTimesheets',
    submitApproval: 'shared-timesheet-logic.submitApproval'
  },
  
  // Direct Object Access
  objects: {
    read: ['hj_timesheets', 'hj_projects', 'contacts'],
    write: ['hj_timesheets', 'hj_approvals']
  }
};
```

## 🔄 **Shared Logic Modules**

### **Approval Logic Module**
```javascript
// File: shared-approval-logic.js
const ApprovalLogic = {
  // Load all pending approvals
  loadApprovals: async (filters = {}) => {
    const query = {
      objectType: 'hj_approvals',
      properties: ['approval_status', 'approver_email', 'approval_project_id'],
      filterGroups: [
        {
          filters: [
            {
              propertyName: 'approval_status',
              operator: 'EQ',
              value: 'Pending'
            }
          ]
        }
      ]
    };
    
    // Add custom filters
    if (filters.projectId) {
      query.filterGroups[0].filters.push({
        propertyName: 'approval_project_id',
        operator: 'EQ',
        value: filters.projectId
      });
    }
    
    return await hubspotClient.crm.objects.searchApi.doSearch(query);
  },
  
  // Process single approval
  processApproval: async (approvalId, decision, comments = '') => {
    const updateData = {
      properties: {
        approval_status: decision,
        approval_comments: comments,
        approval_processed_date: new Date().toISOString()
      }
    };
    
    // Update approval record
    await hubspotClient.crm.objects.hjApprovalsApi.update(approvalId, updateData);
    
    // Update related timesheets
    const approval = await this.getApproval(approvalId);
    await this.updateTimesheetStatus(approval.timesheet_ids, decision);
    
    // Send notifications
    await this.sendNotification(approvalId, decision);
    
    return { success: true, approvalId };
  },
  
  // Update timesheet status
  updateTimesheetStatus: async (timesheetIds, status) => {
    const updatePromises = timesheetIds.map(id => {
      return hubspotClient.crm.objects.hjTimesheetsApi.update(id, {
        properties: { timesheet_status: status }
      });
    });
    
    return await Promise.all(updatePromises);
  },
  
  // Send notification
  sendNotification: async (approvalId, decision) => {
    // Trigger notification workflow
    await hubspotClient.workflowsApi.trigger(approvalId, 'notification-workflow');
  }
};
```

### **Project Logic Module**
```javascript
// File: shared-project-logic.js
const ProjectLogic = {
  // Create new project
  createProject: async (projectData) => {
    const project = {
      properties: {
        hj_project_name: projectData.name,
        hj_project_description: projectData.description,
        hj_project_status: 'Active',
        hj_approver_email: projectData.approverEmail,
        hj_approver_is: projectData.approverType,
        hj_project_start_date: projectData.startDate,
        hj_project_end_date: projectData.endDate
      }
    };
    
    const result = await hubspotClient.crm.objects.hjProjectsApi.create(project);
    
    // Set up associations
    if (projectData.companyId) {
      await this.associateCompany(result.id, projectData.companyId);
    }
    
    if (projectData.consultantId) {
      await this.associateConsultant(result.id, projectData.consultantId);
    }
    
    return result;
  },
  
  // Assign approver to project
  assignApprover: async (projectId, approverData) => {
    const updateData = {
      properties: {
        hj_approver_email: approverData.email,
        hj_approver_name: approverData.name,
        hj_approver_is: approverData.type,
        hj_approver_id: approverData.id
      }
    };
    
    return await hubspotClient.crm.objects.hjProjectsApi.update(projectId, updateData);
  },
  
  // Set up associations
  setupAssociations: async (projectId, associations) => {
    const associationPromises = [];
    
    if (associations.companyId) {
      associationPromises.push(
        this.associateCompany(projectId, associations.companyId)
      );
    }
    
    if (associations.consultantId) {
      associationPromises.push(
        this.associateConsultant(projectId, associations.consultantId)
      );
    }
    
    return await Promise.all(associationPromises);
  }
};
```

### **Timesheet Logic Module**
```javascript
// File: shared-timesheet-logic.js
const TimesheetLogic = {
  // Get timesheets for project
  getTimesheets: async (projectId, filters = {}) => {
    const query = {
      objectType: 'hj_timesheets',
      properties: ['timesheet_consultant_full_name', 'timesheet_hours', 'timesheet_status'],
      filterGroups: [
        {
          filters: [
            {
              propertyName: 'timesheet_project_id',
              operator: 'EQ',
              value: projectId
            }
          ]
        }
      ]
    };
    
    // Add status filter
    if (filters.status) {
      query.filterGroups[0].filters.push({
        propertyName: 'timesheet_status',
        operator: 'EQ',
        value: filters.status
      });
    }
    
    return await hubspotClient.crm.objects.searchApi.doSearch(query);
  },
  
  // Submit timesheets for approval
  submitApproval: async (timesheetIds, projectId, consultantId) => {
    // Create approval record
    const approval = {
      properties: {
        approval_project_id: projectId,
        approval_timesheet_ids_array: timesheetIds.join(','),
        approval_status: 'Pending',
        approval_consultant_id: consultantId,
        approval_created_date: new Date().toISOString()
      }
    };
    
    const result = await hubspotClient.crm.objects.hjApprovalsApi.create(approval);
    
    // Update timesheet status
    await this.updateTimesheetStatus(timesheetIds, 'Submitted for Approval');
    
    // Send notification
    await this.sendApprovalNotification(result.id);
    
    return result;
  },
  
  // Update timesheet status
  updateTimesheetStatus: async (timesheetIds, status) => {
    const updatePromises = timesheetIds.map(id => {
      return hubspotClient.crm.objects.hjTimesheetsApi.update(id, {
        properties: { timesheet_status: status }
      });
    });
    
    return await Promise.all(updatePromises);
  }
};
```

## 🎨 **User Interface Specifications**

### **Approver Dashboard UI**
```html
<!-- Approver Dashboard Layout -->
<div class="approver-dashboard">
  <!-- Header -->
  <div class="dashboard-header">
    <h1>Approval Dashboard</h1>
    <div class="user-info">
      <span>Welcome, {{ approver_name }}</span>
    </div>
  </div>
  
  <!-- Filter Panel -->
  <div class="filter-panel">
    <input type="text" placeholder="Search approvals..." class="search-input">
    <select class="status-filter">
      <option value="">All Status</option>
      <option value="Pending">Pending</option>
      <option value="Approved">Approved</option>
      <option value="Rejected">Rejected</option>
    </select>
    <select class="project-filter">
      <option value="">All Projects</option>
      <!-- Project options populated dynamically -->
    </select>
  </div>
  
  <!-- Approval List -->
  <div class="approval-list">
    <div class="list-header">
      <input type="checkbox" class="select-all">
      <span>Select All</span>
      <button class="bulk-approve">Bulk Approve</button>
      <button class="bulk-reject">Bulk Reject</button>
    </div>
    
    <div class="approval-items">
      <!-- Approval items populated dynamically -->
    </div>
  </div>
  
  <!-- Approval Detail Modal -->
  <div class="approval-detail-modal" style="display: none;">
    <div class="modal-content">
      <h3>Approval Details</h3>
      <div class="approval-info">
        <!-- Approval details populated dynamically -->
      </div>
      <div class="approval-actions">
        <button class="approve-btn">Approve</button>
        <button class="reject-btn">Reject</button>
        <button class="cancel-btn">Cancel</button>
      </div>
    </div>
  </div>
</div>
```

### **Project Setup UI**
```html
<!-- Project Setup Layout -->
<div class="project-setup">
  <!-- Header -->
  <div class="setup-header">
    <h1>Project Setup</h1>
    <button class="save-project">Save Project</button>
  </div>
  
  <!-- Project Form -->
  <div class="project-form">
    <div class="form-section">
      <h3>Project Information</h3>
      <input type="text" placeholder="Project Name" class="project-name">
      <textarea placeholder="Project Description" class="project-description"></textarea>
      <input type="date" class="start-date">
      <input type="date" class="end-date">
    </div>
    
    <div class="form-section">
      <h3>Approver Assignment</h3>
      <select class="approver-type">
        <option value="HJPetro">Internal (H&J Staff)</option>
        <option value="PrimaryContact">External (Customer)</option>
      </select>
      <input type="email" placeholder="Approver Email" class="approver-email">
      <input type="text" placeholder="Approver Name" class="approver-name">
    </div>
    
    <div class="form-section">
      <h3>Associations</h3>
      <select class="company-select">
        <option value="">Select Company</option>
        <!-- Company options populated dynamically -->
      </select>
      <select class="consultant-select">
        <option value="">Select Consultant</option>
        <!-- Consultant options populated dynamically -->
      </select>
    </div>
  </div>
</div>
```

## 🔄 **Data Flow Architecture**

### **Approval Processing Flow**
```
1. User selects timesheets → TimesheetManagement.selectTimesheets()
2. User submits for approval → TimesheetLogic.submitApproval()
3. System creates approval record → Direct object write to hj_approvals
4. System updates timesheet status → Direct object write to hj_timesheets
5. System sends notification → Workflow trigger
6. Approver receives notification → Email/notification
7. Approver processes approval → ApproverDashboard.processApproval()
8. System updates approval status → Direct object write to hj_approvals
9. System updates timesheet status → Direct object write to hj_timesheets
10. System sends confirmation → Workflow trigger
```

### **Project Setup Flow**
```
1. User accesses project setup → ProjectSetup module
2. User fills project form → Form validation
3. User assigns approver → ApproverLogic.assignApprover()
4. User sets up associations → AssociationLogic.setupAssociations()
5. User saves project → ProjectLogic.createProject()
6. System creates project record → Direct object write to hj_projects
7. System sets up associations → Direct object writes to associations
8. System confirms creation → Success message
```

## 📊 **Performance Optimizations**

### **Caching Strategy**
```javascript
// Cache frequently accessed data
const Cache = {
  projects: new Map(),
  approvers: new Map(),
  timesheets: new Map(),
  
  get: (key, type) => {
    const cache = Cache[type];
    if (cache.has(key)) {
      return cache.get(key);
    }
    return null;
  },
  
  set: (key, value, type) => {
    const cache = Cache[type];
    cache.set(key, value);
  }
};
```

### **Batch Operations**
```javascript
// Batch multiple operations
const BatchOperations = {
  updateTimesheets: async (updates) => {
    const batch = updates.map(update => ({
      id: update.id,
      properties: update.properties
    }));
    
    return await hubspotClient.crm.objects.hjTimesheetsApi.batchUpdate(batch);
  },
  
  createApprovals: async (approvals) => {
    const batch = approvals.map(approval => ({
      properties: approval.properties
    }));
    
    return await hubspotClient.crm.objects.hjApprovalsApi.batchCreate(batch);
  }
};
```

## 🚨 **Error Handling**

### **Global Error Handler**
```javascript
const ErrorHandler = {
  handle: (error, context) => {
    console.error(`Error in ${context}:`, error);
    
    // Log error for monitoring
    this.logError(error, context);
    
    // Show user-friendly message
    this.showUserError(error);
    
    // Attempt recovery if possible
    this.attemptRecovery(error, context);
  },
  
  logError: (error, context) => {
    // Send to monitoring service
    monitoringService.logError(error, context);
  },
  
  showUserError: (error) => {
    // Show user-friendly error message
    ui.showError('An error occurred. Please try again.');
  },
  
  attemptRecovery: (error, context) => {
    // Attempt to recover from error
    if (error.type === 'network') {
      this.retryOperation(context);
    }
  }
};
```

---

*This technical specification provides the complete blueprint for implementing the new approval architecture.*
