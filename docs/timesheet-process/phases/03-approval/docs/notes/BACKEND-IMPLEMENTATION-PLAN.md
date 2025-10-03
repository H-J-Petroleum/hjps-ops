# 🔧 Backend Implementation Plan - Data Flow First

*Backend-focused implementation plan for the redesigned approval process*

## 🎯 **Implementation Philosophy**

### **Backend-First Approach**
- **Data Flow First:** Ensure all data operations work correctly
- **Logic Validation:** Test all business logic before UI
- **Object Relationships:** Verify all object associations
- **API Integration:** Test all HubSpot API calls
- **Error Handling:** Robust error handling and validation

## 📊 **Backend Implementation Phases**

### **Phase 1: Core Data Objects & Properties (Sprint 1)**
- **Goal:** Set up and validate all object structures
- **Focus:** Data integrity and object relationships

#### **1.1 Object Structure Setup**
```javascript
// HJ Projects Object (2-118270518) - Enhanced
const HJProjectsSchema = {
  // Core Project Properties
  hj_project_name: 'string',
  hj_project_description: 'string',
  hj_project_status: 'enum', // Active, Inactive, Completed
  
  // Approver Configuration
  hj_approver_email: 'string',
  hj_approver_name: 'string',
  hj_approver_is: 'enum', // HJPetro, PrimaryContact
  hj_approver_id: 'string',
  
  // Project Dates
  hj_project_start_date: 'date',
  hj_project_end_date: 'date',
  
  // Approval Settings
  hj_approval_required: 'boolean',
  hj_approval_workflow: 'string',
  hj_approval_escalation_days: 'number',
  
  // Associations
  hj_company_id: 'string',
  hj_consultant_id: 'string',
  hj_deal_id: 'string'
};

// HJ Timesheets Object (2-26173281) - Enhanced
const HJTimesheetsSchema = {
  // Core Timesheet Properties
  timesheet_consultant_full_name: 'string',
  timesheet_project_id: 'string',
  timesheet_hours: 'number',
  timesheet_date: 'date',
  timesheet_description: 'string',
  
  // Status Management
  timesheet_status: 'enum', // Draft, Submitted, Approved, Rejected
  timesheet_approval_id: 'string',
  timesheet_approval_date: 'date',
  
  // Approval Tracking
  timesheet_submitted_date: 'date',
  timesheet_approved_date: 'date',
  timesheet_rejected_date: 'date',
  timesheet_rejection_reason: 'string',
  
  // Associations
  timesheet_consultant_id: 'string',
  timesheet_company_id: 'string'
};

// HJ Approvals Object (2-26103010) - Enhanced
const HJApprovalsSchema = {
  // Core Approval Properties
  approval_project_id: 'string',
  approval_timesheet_ids_array: 'string', // Comma-separated
  approval_status: 'enum', // Pending, Approved, Rejected
  approval_consultant_id: 'string',
  
  // Approver Information
  approver_email: 'string',
  approver_name: 'string',
  approver_is: 'enum', // HJPetro, PrimaryContact
  approver_id: 'string',
  
  // Approval Dates
  approval_created_date: 'date',
  approval_processed_date: 'date',
  approval_due_date: 'date',
  
  // Approval Details
  approval_comments: 'string',
  approval_rejection_reason: 'string',
  approval_escalation_flag: 'boolean',
  
  // Notification Tracking
  notification_sent: 'boolean',
  notification_sent_date: 'date',
  reminder_sent: 'boolean',
  reminder_sent_date: 'date'
};
```

#### **1.2 Object Validation Functions**
```javascript
// Object validation functions
const ObjectValidator = {
  validateProject: (projectData) => {
    const required = ['hj_project_name', 'hj_approver_email', 'hj_approver_is'];
    const missing = required.filter(field => !projectData[field]);
    
    if (missing.length > 0) {
      throw new Error(`Missing required fields: ${missing.join(', ')}`);
    }
    
    // Validate email format
    if (!this.isValidEmail(projectData.hj_approver_email)) {
      throw new Error('Invalid approver email format');
    }
    
    // Validate approver type
    const validTypes = ['HJPetro', 'PrimaryContact'];
    if (!validTypes.includes(projectData.hj_approver_is)) {
      throw new Error(`Invalid approver type: ${projectData.hj_approver_is}`);
    }
    
    return { valid: true, projectData };
  },
  
  validateTimesheet: (timesheetData) => {
    const required = ['timesheet_consultant_full_name', 'timesheet_project_id', 'timesheet_hours'];
    const missing = required.filter(field => !timesheetData[field]);
    
    if (missing.length > 0) {
      throw new Error(`Missing required fields: ${missing.join(', ')}`);
    }
    
    // Validate hours
    if (timesheetData.timesheet_hours <= 0) {
      throw new Error('Timesheet hours must be greater than 0');
    }
    
    return { valid: true, timesheetData };
  },
  
  validateApproval: (approvalData) => {
    const required = ['approval_project_id', 'approval_timesheet_ids_array', 'approver_email'];
    const missing = required.filter(field => !approvalData[field]);
    
    if (missing.length > 0) {
      throw new Error(`Missing required fields: ${missing.join(', ')}`);
    }
    
    // Validate timesheet IDs
    const timesheetIds = approvalData.approval_timesheet_ids_array.split(',');
    if (timesheetIds.length === 0) {
      throw new Error('No timesheet IDs provided');
    }
    
    return { valid: true, approvalData };
  }
};
```

### **Phase 2: Core Business Logic (Sprint 2)**
- **Goal:** Implement all business logic functions
- **Focus:** Data processing and business rules

#### **2.1 Project Management Logic**
```javascript
// Project management functions
const ProjectLogic = {
  // Create new project
  createProject: async (projectData) => {
    // Validate project data
    const validation = ObjectValidator.validateProject(projectData);
    if (!validation.valid) {
      throw new Error(validation.error);
    }
    
    // Create project object
    const project = {
      properties: {
        ...projectData,
        hj_project_status: 'Active',
        hj_approval_required: true,
        hj_approval_escalation_days: 3
      }
    };
    
    const result = await hubspotClient.crm.objects.hjProjectsApi.create(project);
    
    // Set up associations
    if (projectData.hj_company_id) {
      await this.associateCompany(result.id, projectData.hj_company_id);
    }
    
    if (projectData.hj_consultant_id) {
      await this.associateConsultant(result.id, projectData.hj_consultant_id);
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
  
  // Get project with approver info
  getProjectWithApprover: async (projectId) => {
    const project = await hubspotClient.crm.objects.hjProjectsApi.getById(projectId);
    
    // Get approver details if internal
    if (project.properties.hj_approver_is === 'HJPetro') {
      const approver = await hubspotClient.crm.contactsApi.getById(project.properties.hj_approver_id);
      project.approver_details = approver;
    }
    
    return project;
  }
};
```

#### **2.2 Timesheet Management Logic**
```javascript
// Timesheet management functions
const TimesheetLogic = {
  // Get timesheets for project
  getTimesheetsForProject: async (projectId, filters = {}) => {
    const query = {
      objectType: 'hj_timesheets',
      properties: [
        'timesheet_consultant_full_name',
        'timesheet_hours',
        'timesheet_date',
        'timesheet_status',
        'timesheet_description'
      ],
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
    
    // Add date range filter
    if (filters.startDate && filters.endDate) {
      query.filterGroups[0].filters.push({
        propertyName: 'timesheet_date',
        operator: 'BETWEEN',
        value: filters.startDate,
        highValue: filters.endDate
      });
    }
    
    return await hubspotClient.crm.objects.searchApi.doSearch(query);
  },
  
  // Update timesheet status
  updateTimesheetStatus: async (timesheetId, status, reason = '') => {
    const updateData = {
      properties: {
        timesheet_status: status,
        timesheet_processed_date: new Date().toISOString()
      }
    };
    
    if (status === 'Rejected' && reason) {
      updateData.properties.timesheet_rejection_reason = reason;
    }
    
    return await hubspotClient.crm.objects.hjTimesheetsApi.update(timesheetId, updateData);
  },
  
  // Bulk update timesheet status
  updateTimesheetStatusBulk: async (timesheetIds, status, reason = '') => {
    const updatePromises = timesheetIds.map(id => 
      this.updateTimesheetStatus(id, status, reason)
    );
    
    return await Promise.all(updatePromises);
  }
};
```

#### **2.3 Approval Processing Logic**
```javascript
// Approval processing functions
const ApprovalLogic = {
  // Create approval request
  createApprovalRequest: async (timesheetIds, projectId, consultantId) => {
    // Get project details
    const project = await ProjectLogic.getProjectWithApprover(projectId);
    
    // Validate timesheet IDs
    const timesheets = await Promise.all(
      timesheetIds.map(id => 
        hubspotClient.crm.objects.hjTimesheetsApi.getById(id)
      )
    );
    
    // Create approval record
    const approval = {
      properties: {
        approval_project_id: projectId,
        approval_timesheet_ids_array: timesheetIds.join(','),
        approval_status: 'Pending',
        approval_consultant_id: consultantId,
        approver_email: project.properties.hj_approver_email,
        approver_name: project.properties.hj_approver_name,
        approver_is: project.properties.hj_approver_is,
        approver_id: project.properties.hj_approver_id,
        approval_created_date: new Date().toISOString(),
        approval_due_date: this.calculateDueDate(project.properties.hj_approval_escalation_days),
        notification_sent: false,
        reminder_sent: false
      }
    };
    
    const result = await hubspotClient.crm.objects.hjApprovalsApi.create(approval);
    
    // Update timesheet status
    await TimesheetLogic.updateTimesheetStatusBulk(timesheetIds, 'Submitted for Approval');
    
    // Send notification
    await this.sendApprovalNotification(result.id);
    
    return result;
  },
  
  // Process approval decision
  processApprovalDecision: async (approvalId, decision, comments = '') => {
    // Get approval details
    const approval = await hubspotClient.crm.objects.hjApprovalsApi.getById(approvalId);
    
    // Update approval status
    const updateData = {
      properties: {
        approval_status: decision,
        approval_processed_date: new Date().toISOString(),
        approval_comments: comments
      }
    };
    
    if (decision === 'Rejected' && comments) {
      updateData.properties.approval_rejection_reason = comments;
    }
    
    await hubspotClient.crm.objects.hjApprovalsApi.update(approvalId, updateData);
    
    // Update timesheet status
    const timesheetIds = approval.properties.approval_timesheet_ids_array.split(',');
    await TimesheetLogic.updateTimesheetStatusBulk(timesheetIds, decision, comments);
    
    // Send confirmation notification
    await this.sendApprovalConfirmation(approvalId, decision);
    
    return { success: true, approvalId, decision };
  },
  
  // Get pending approvals
  getPendingApprovals: async (filters = {}) => {
    const query = {
      objectType: 'hj_approvals',
      properties: [
        'approval_project_id',
        'approval_timesheet_ids_array',
        'approval_status',
        'approver_email',
        'approver_name',
        'approval_created_date',
        'approval_due_date'
      ],
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
    
    // Add approver filter
    if (filters.approverEmail) {
      query.filterGroups[0].filters.push({
        propertyName: 'approver_email',
        operator: 'EQ',
        value: filters.approverEmail
      });
    }
    
    return await hubspotClient.crm.objects.searchApi.doSearch(query);
  }
};
```

### **Phase 3: API Integration & Error Handling (Sprint 3)**
- **Goal:** Robust API integration and error handling
- **Focus:** Reliability and error recovery

#### **3.1 HubSpot API Wrapper**
```javascript
// HubSpot API wrapper with error handling
const HubSpotAPI = {
  // Generic object operations
  createObject: async (objectType, data) => {
    try {
      const result = await hubspotClient.crm.objects[objectType].create(data);
      return { success: true, data: result };
    } catch (error) {
      console.error(`Error creating ${objectType}:`, error);
      return { success: false, error: error.message };
    }
  },
  
  updateObject: async (objectType, objectId, data) => {
    try {
      const result = await hubspotClient.crm.objects[objectType].update(objectId, data);
      return { success: true, data: result };
    } catch (error) {
      console.error(`Error updating ${objectType}:`, error);
      return { success: false, error: error.message };
    }
  },
  
  getObject: async (objectType, objectId) => {
    try {
      const result = await hubspotClient.crm.objects[objectType].getById(objectId);
      return { success: true, data: result };
    } catch (error) {
      console.error(`Error getting ${objectType}:`, error);
      return { success: false, error: error.message };
    }
  },
  
  searchObjects: async (objectType, query) => {
    try {
      const result = await hubspotClient.crm.objects.searchApi.doSearch(query);
      return { success: true, data: result };
    } catch (error) {
      console.error(`Error searching ${objectType}:`, error);
      return { success: false, error: error.message };
    }
  }
};
```

#### **3.2 Error Handling & Recovery**
```javascript
// Error handling and recovery system
const ErrorHandler = {
  // Handle API errors
  handleAPIError: (error, context) => {
    const errorInfo = {
      context,
      error: error.message,
      timestamp: new Date().toISOString(),
      stack: error.stack
    };
    
    // Log error
    console.error('API Error:', errorInfo);
    
    // Determine error type
    if (error.status === 429) {
      return { type: 'rate_limit', message: 'Rate limit exceeded, retrying...' };
    } else if (error.status === 404) {
      return { type: 'not_found', message: 'Object not found' };
    } else if (error.status >= 500) {
      return { type: 'server_error', message: 'Server error, retrying...' };
    } else {
      return { type: 'client_error', message: 'Client error: ' + error.message };
    }
  },
  
  // Retry mechanism
  retryOperation: async (operation, maxRetries = 3, delay = 1000) => {
    for (let i = 0; i < maxRetries; i++) {
      try {
        return await operation();
      } catch (error) {
        if (i === maxRetries - 1) {
          throw error;
        }
        
        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, i)));
      }
    }
  },
  
  // Rollback mechanism
  rollbackOperation: async (operations) => {
    for (const operation of operations.reverse()) {
      try {
        await operation.rollback();
      } catch (error) {
        console.error('Rollback failed:', error);
      }
    }
  }
};
```

### **Phase 4: Data Validation & Testing (Sprint 4)**
- **Goal:** Comprehensive testing and validation
- **Focus:** Data integrity and business logic validation

#### **4.1 Data Integrity Tests**
```javascript
// Data integrity testing
const DataIntegrityTests = {
  // Test project creation
  testProjectCreation: async () => {
    const testProject = {
      hj_project_name: 'Test Project',
      hj_approver_email: 'test@example.com',
      hj_approver_is: 'HJPetro',
      hj_project_start_date: '2025-01-01',
      hj_project_end_date: '2025-12-31'
    };
    
    const result = await ProjectLogic.createProject(testProject);
    
    // Validate creation
    assert(result.id, 'Project ID should be returned');
    assert(result.properties.hj_project_name === testProject.hj_project_name, 'Project name should match');
    
    return { success: true, projectId: result.id };
  },
  
  // Test approval creation
  testApprovalCreation: async (projectId) => {
    // Create test timesheets
    const timesheetIds = await this.createTestTimesheets(projectId);
    
    // Create approval
    const result = await ApprovalLogic.createApprovalRequest(timesheetIds, projectId, 'test-consultant');
    
    // Validate creation
    assert(result.id, 'Approval ID should be returned');
    assert(result.properties.approval_status === 'Pending', 'Status should be Pending');
    
    return { success: true, approvalId: result.id };
  },
  
  // Test approval processing
  testApprovalProcessing: async (approvalId) => {
    // Process approval
    const result = await ApprovalLogic.processApprovalDecision(approvalId, 'Approved', 'Test approval');
    
    // Validate processing
    assert(result.success, 'Approval should be processed successfully');
    
    return { success: true };
  }
};
```

## 📋 **Backend Implementation Checklist**

### **Sprint 1: Object Structure**
- [ ] Define all object schemas
- [ ] Implement object validation functions
- [ ] Test object creation and updates
- [ ] Validate object relationships
- [ ] Test property validation

### **Sprint 2: Business Logic**
- [ ] Implement project management logic
- [ ] Implement timesheet management logic
- [ ] Implement approval processing logic
- [ ] Test all business logic functions
- [ ] Validate data flow

### **Sprint 3: API Integration**
- [ ] Implement HubSpot API wrapper
- [ ] Add error handling and recovery
- [ ] Implement retry mechanisms
- [ ] Test API integration
- [ ] Validate error handling

### **Sprint 4: Testing & Validation**
- [ ] Implement data integrity tests
- [ ] Test complete data flow
- [ ] Validate business logic
- [ ] Performance testing
- [ ] Error scenario testing

## 🎯 **Success Criteria**

### **Technical Success**
- **Data Integrity:** 100% data accuracy
- **API Reliability:** >99% success rate
- **Error Handling:** Graceful error recovery
- **Performance:** <2 second response times

### **Business Logic Success**
- **Project Creation:** Complete project setup
- **Timesheet Management:** Full timesheet lifecycle
- **Approval Processing:** Complete approval workflow
- **Status Updates:** Real-time status tracking

---

*This backend implementation plan ensures all data operations work correctly before building the frontend interfaces.*
