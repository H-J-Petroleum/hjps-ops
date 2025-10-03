# 🔧 Backend Implementation Guide

*Step-by-step guide for implementing the backend approval system*

## 🎯 **Implementation Overview**

This guide walks through implementing the backend approval system step by step, ensuring all data operations work correctly before building the frontend.

## 📋 **Prerequisites**

### **Required Tools**
- Node.js (v16 or higher)
- npm or yarn package manager
- HubSpot Developer Account
- HubSpot Private App with appropriate permissions

### **Required Permissions**
- Read/Write access to HJ Projects object
- Read/Write access to HJ Timesheets object  
- Read/Write access to HJ Approvals object
- Read/Write access to Contacts object
- Read/Write access to Companies object
- Read/Write access to Associations

## 🚀 **Step 1: Project Setup**

### **1.1 Initialize Node.js Project**
```bash
mkdir hj-approval-backend
cd hj-approval-backend
npm init -y
```

### **1.2 Install Dependencies**
```bash
npm install @hubspot/api-client
npm install --save-dev jest
```

### **1.2 Create Project Structure**
```
hj-approval-backend/
├── src/
│   ├── core/
│   │   ├── core-approval-logic.js
│   │   └── object-validator.js
│   ├── services/
│   │   ├── project-service.js
│   │   ├── timesheet-service.js
│   │   └── approval-service.js
│   ├── config/
│   │   └── hubspot-config.js
│   └── utils/
│       └── error-handler.js
├── tests/
│   ├── unit/
│   ├── integration/
│   └── test-approval-logic.js
├── package.json
└── README.md
```

## 🔧 **Step 2: HubSpot Configuration**

### **2.1 Create HubSpot Configuration**
```javascript
// src/config/hubspot-config.js
const hubspot = require('@hubspot/api-client');

class HubSpotConfig {
  constructor() {
    this.client = null;
    this.isInitialized = false;
  }
  
  async initialize(accessToken) {
    try {
      this.client = new hubspot.Client({ accessToken });
      
      // Test connection
      await this.client.crm.objects.hjProjectsApi.getPage(1);
      
      this.isInitialized = true;
      console.log('HubSpot client initialized successfully');
      
      return { success: true };
    } catch (error) {
      console.error('Failed to initialize HubSpot client:', error);
      return { success: false, error: error.message };
    }
  }
  
  getClient() {
    if (!this.isInitialized) {
      throw new Error('HubSpot client not initialized');
    }
    return this.client;
  }
}

module.exports = new HubSpotConfig();
```

### **2.2 Environment Configuration**
```javascript
// src/config/environment.js
const config = {
  development: {
    hubspot: {
      accessToken: process.env.HUBSPOT_ACCESS_TOKEN_DEV
    }
  },
  production: {
    hubspot: {
      accessToken: process.env.HUBSPOT_ACCESS_TOKEN_PROD
    }
  }
};

const environment = process.env.NODE_ENV || 'development';
module.exports = config[environment];
```

## 🏗️ **Step 3: Core Logic Implementation**

### **3.1 Object Validator**
```javascript
// src/core/object-validator.js
class ObjectValidator {
  static validateProject(projectData) {
    const required = [
      'hj_project_name',
      'hj_approver_email', 
      'hj_approver_is'
    ];
    
    const missing = required.filter(field => !projectData[field]);
    if (missing.length > 0) {
      throw new Error(`Missing required project fields: ${missing.join(', ')}`);
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
    
    return { valid: true, data: projectData };
  }
  
  static validateTimesheet(timesheetData) {
    const required = [
      'timesheet_consultant_full_name',
      'timesheet_project_id',
      'timesheet_hours'
    ];
    
    const missing = required.filter(field => !timesheetData[field]);
    if (missing.length > 0) {
      throw new Error(`Missing required timesheet fields: ${missing.join(', ')}`);
    }
    
    // Validate hours
    if (timesheetData.timesheet_hours <= 0) {
      throw new Error('Timesheet hours must be greater than 0');
    }
    
    return { valid: true, data: timesheetData };
  }
  
  static validateApproval(approvalData) {
    const required = [
      'approval_project_id',
      'approval_timesheet_ids_array',
      'approver_email'
    ];
    
    const missing = required.filter(field => !approvalData[field]);
    if (missing.length > 0) {
      throw new Error(`Missing required approval fields: ${missing.join(', ')}`);
    }
    
    // Validate timesheet IDs
    const timesheetIds = approvalData.approval_timesheet_ids_array.split(',');
    if (timesheetIds.length === 0) {
      throw new Error('No timesheet IDs provided');
    }
    
    return { valid: true, data: approvalData };
  }
  
  static isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}

module.exports = ObjectValidator;
```

### **3.2 Error Handler**
```javascript
// src/utils/error-handler.js
class ErrorHandler {
  static handle(error, context) {
    const errorInfo = {
      context,
      error: error.message,
      timestamp: new Date().toISOString(),
      stack: error.stack
    };
    
    // Log error
    console.error('Error:', errorInfo);
    
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
  }
  
  static async retryOperation(operation, maxRetries = 3, delay = 1000) {
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
  }
}

module.exports = ErrorHandler;
```

## 🔄 **Step 4: Service Implementation**

### **4.1 Project Service**
```javascript
// src/services/project-service.js
const hubspotConfig = require('../config/hubspot-config');
const ObjectValidator = require('../core/object-validator');
const ErrorHandler = require('../utils/error-handler');

class ProjectService {
  constructor() {
    this.client = hubspotConfig.getClient();
  }
  
  async createProject(projectData) {
    try {
      // Validate project data
      const validation = ObjectValidator.validateProject(projectData);
      if (!validation.valid) {
        throw new Error(validation.error);
      }
      
      // Prepare project object
      const project = {
        properties: {
          ...projectData,
          hj_project_status: 'Active'
        }
      };
      
      // Create project
      const result = await this.client.crm.objects.hjProjectsApi.create(project);
      
      return {
        success: true,
        data: result,
        projectId: result.id
      };
      
    } catch (error) {
      const errorInfo = ErrorHandler.handle(error, 'createProject');
      return {
        success: false,
        error: errorInfo.message
      };
    }
  }
  
  async assignApprover(projectId, approverData) {
    try {
      const updateData = {
        properties: {
          hj_approver_email: approverData.email,
          hj_approver_name: approverData.name,
          hj_approver_is: approverData.type,
          hj_approver_id: approverData.id
        }
      };
      
      const result = await this.client.crm.objects.hjProjectsApi.update(projectId, updateData);
      
      return {
        success: true,
        data: result
      };
      
    } catch (error) {
      const errorInfo = ErrorHandler.handle(error, 'assignApprover');
      return {
        success: false,
        error: errorInfo.message
      };
    }
  }
  
  async getProjectWithApprover(projectId) {
    try {
      const project = await this.client.crm.objects.hjProjectsApi.getById(projectId);
      
      // Get approver details if internal
      if (project.properties.hj_approver_is === 'HJPetro') {
        const approverId = project.properties.hj_approver_id;
        if (approverId) {
          const approver = await this.client.crm.contactsApi.getById(approverId);
          project.approver_details = approver;
        }
      }
      
      return {
        success: true,
        data: project
      };
      
    } catch (error) {
      const errorInfo = ErrorHandler.handle(error, 'getProjectWithApprover');
      return {
        success: false,
        error: errorInfo.message
      };
    }
  }
}

module.exports = ProjectService;
```

### **4.2 Timesheet Service**
```javascript
// src/services/timesheet-service.js
const hubspotConfig = require('../config/hubspot-config');
const ObjectValidator = require('../core/object-validator');
const ErrorHandler = require('../utils/error-handler');

class TimesheetService {
  constructor() {
    this.client = hubspotConfig.getClient();
  }
  
  async getTimesheetsForProject(projectId, filters = {}) {
    try {
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
      
      const result = await this.client.crm.objects.searchApi.doSearch(query);
      
      return {
        success: true,
        data: result.results,
        total: result.total
      };
      
    } catch (error) {
      const errorInfo = ErrorHandler.handle(error, 'getTimesheetsForProject');
      return {
        success: false,
        error: errorInfo.message
      };
    }
  }
  
  async updateTimesheetStatus(timesheetId, status, reason = '') {
    try {
      const updateData = {
        properties: {
          timesheet_status: status
        }
      };
      
      if (status === 'Rejected' && reason) {
        updateData.properties.timesheet_rejection_reason = reason;
      }
      
      const result = await this.client.crm.objects.hjTimesheetsApi.update(timesheetId, updateData);
      
      return {
        success: true,
        data: result
      };
      
    } catch (error) {
      const errorInfo = ErrorHandler.handle(error, 'updateTimesheetStatus');
      return {
        success: false,
        error: errorInfo.message
      };
    }
  }
  
  async updateTimesheetStatusBulk(timesheetIds, status, reason = '') {
    try {
      const updatePromises = timesheetIds.map(id => 
        this.updateTimesheetStatus(id, status, reason)
      );
      
      const results = await Promise.all(updatePromises);
      
      // Check if all updates were successful
      const failed = results.filter(result => !result.success);
      if (failed.length > 0) {
        throw new Error(`${failed.length} timesheet updates failed`);
      }
      
      return {
        success: true,
        data: results
      };
      
    } catch (error) {
      const errorInfo = ErrorHandler.handle(error, 'updateTimesheetStatusBulk');
      return {
        success: false,
        error: errorInfo.message
      };
    }
  }
}

module.exports = TimesheetService;
```

### **4.3 Approval Service**
```javascript
// src/services/approval-service.js
const hubspotConfig = require('../config/hubspot-config');
const ObjectValidator = require('../core/object-validator');
const ErrorHandler = require('../utils/error-handler');
const ProjectService = require('./project-service');
const TimesheetService = require('./timesheet-service');

class ApprovalService {
  constructor() {
    this.client = hubspotConfig.getClient();
    this.projectService = new ProjectService();
    this.timesheetService = new TimesheetService();
  }
  
  async createApprovalRequest(timesheetIds, projectId, consultantId) {
    try {
      // Get project details
      const projectResult = await this.projectService.getProjectWithApprover(projectId);
      if (!projectResult.success) {
        throw new Error(`Failed to get project: ${projectResult.error}`);
      }
      
      const project = projectResult.data;
      
      // Validate timesheet IDs
      const timesheets = await Promise.all(
        timesheetIds.map(id => 
          this.client.crm.objects.hjTimesheetsApi.getById(id)
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
          approval_created_date: new Date().toISOString()
        }
      };
      
      const result = await this.client.crm.objects.hjApprovalsApi.create(approval);
      
      // Update timesheet status
      const timesheetResult = await this.timesheetService.updateTimesheetStatusBulk(
        timesheetIds, 
        'Submitted for Approval'
      );
      
      if (!timesheetResult.success) {
        throw new Error(`Failed to update timesheet status: ${timesheetResult.error}`);
      }
      
      return {
        success: true,
        data: result,
        approvalId: result.id
      };
      
    } catch (error) {
      const errorInfo = ErrorHandler.handle(error, 'createApprovalRequest');
      return {
        success: false,
        error: errorInfo.message
      };
    }
  }
  
  async processApprovalDecision(approvalId, decision, comments = '') {
    try {
      // Get approval details
      const approval = await this.client.crm.objects.hjApprovalsApi.getById(approvalId);
      
      // Update approval status
      const updateData = {
        properties: {
          approval_status: decision,
          approval_processed_date: new Date().toISOString()
        }
      };
      
      if (comments) {
        updateData.properties.approval_comments = comments;
      }
      
      if (decision === 'Rejected' && comments) {
        updateData.properties.approval_rejection_reason = comments;
      }
      
      await this.client.crm.objects.hjApprovalsApi.update(approvalId, updateData);
      
      // Update timesheet status
      const timesheetIds = approval.properties.approval_timesheet_ids_array.split(',');
      const timesheetResult = await this.timesheetService.updateTimesheetStatusBulk(
        timesheetIds, 
        decision, 
        comments
      );
      
      if (!timesheetResult.success) {
        throw new Error(`Failed to update timesheet status: ${timesheetResult.error}`);
      }
      
      return {
        success: true,
        approvalId,
        decision
      };
      
    } catch (error) {
      const errorInfo = ErrorHandler.handle(error, 'processApprovalDecision');
      return {
        success: false,
        error: errorInfo.message
      };
    }
  }
  
  async getPendingApprovals(filters = {}) {
    try {
      const query = {
        objectType: 'hj_approvals',
        properties: [
          'approval_project_id',
          'approval_timesheet_ids_array',
          'approval_status',
          'approver_email',
          'approver_name',
          'approval_created_date'
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
      
      const result = await this.client.crm.objects.searchApi.doSearch(query);
      
      return {
        success: true,
        data: result.results,
        total: result.total
      };
      
    } catch (error) {
      const errorInfo = ErrorHandler.handle(error, 'getPendingApprovals');
      return {
        success: false,
        error: errorInfo.message
      };
    }
  }
}

module.exports = ApprovalService;
```

## 🧪 **Step 5: Testing Implementation**

### **5.1 Unit Tests**
```javascript
// tests/unit/project-service.test.js
const ProjectService = require('../../src/services/project-service');

describe('ProjectService', () => {
  let projectService;
  
  beforeEach(() => {
    projectService = new ProjectService();
  });
  
  test('should create project successfully', async () => {
    const projectData = {
      hj_project_name: 'Test Project',
      hj_approver_email: 'test@example.com',
      hj_approver_is: 'HJPetro'
    };
    
    const result = await projectService.createProject(projectData);
    
    expect(result.success).toBe(true);
    expect(result.projectId).toBeDefined();
  });
  
  test('should handle validation errors', async () => {
    const projectData = {
      hj_project_name: 'Test Project'
      // Missing required fields
    };
    
    const result = await projectService.createProject(projectData);
    
    expect(result.success).toBe(false);
    expect(result.error).toContain('Missing required project fields');
  });
});
```

### **5.2 Integration Tests**
```javascript
// tests/integration/approval-workflow.test.js
const ApprovalService = require('../../src/services/approval-service');
const ProjectService = require('../../src/services/project-service');
const TimesheetService = require('../../src/services/timesheet-service');

describe('Approval Workflow Integration', () => {
  let approvalService;
  let projectService;
  let timesheetService;
  
  beforeEach(() => {
    approvalService = new ApprovalService();
    projectService = new ProjectService();
    timesheetService = new TimesheetService();
  });
  
  test('complete approval workflow', async () => {
    // 1. Create project
    const projectData = {
      hj_project_name: 'Integration Test Project',
      hj_approver_email: 'approver@example.com',
      hj_approver_is: 'HJPetro'
    };
    
    const projectResult = await projectService.createProject(projectData);
    expect(projectResult.success).toBe(true);
    
    // 2. Create timesheets
    const timesheetIds = ['timesheet1', 'timesheet2'];
    
    // 3. Create approval request
    const approvalResult = await approvalService.createApprovalRequest(
      timesheetIds, 
      projectResult.projectId, 
      'consultant123'
    );
    expect(approvalResult.success).toBe(true);
    
    // 4. Process approval
    const processResult = await approvalService.processApprovalDecision(
      approvalResult.approvalId, 
      'Approved', 
      'Integration test approval'
    );
    expect(processResult.success).toBe(true);
  });
});
```

## 🚀 **Step 6: Running the Backend**

### **6.1 Environment Setup**
```bash
# Create .env file
echo "HUBSPOT_ACCESS_TOKEN_DEV=your_dev_token" > .env
echo "HUBSPOT_ACCESS_TOKEN_PROD=your_prod_token" >> .env
echo "NODE_ENV=development" >> .env
```

### **6.2 Initialize HubSpot Client**
```javascript
// src/index.js
const hubspotConfig = require('./config/hubspot-config');
const environment = require('./config/environment');

async function initialize() {
  try {
    // Initialize HubSpot client
    const initResult = await hubspotConfig.initialize(environment.hubspot.accessToken);
    
    if (!initResult.success) {
      console.error('Failed to initialize HubSpot client:', initResult.error);
      process.exit(1);
    }
    
    console.log('Backend system initialized successfully');
    
    // Run tests
    await runTests();
    
  } catch (error) {
    console.error('Initialization failed:', error);
    process.exit(1);
  }
}

async function runTests() {
  console.log('Running backend tests...');
  
  // Test project creation
  const projectService = new (require('./services/project-service'))();
  const projectResult = await projectService.createProject({
    hj_project_name: 'Test Project',
    hj_approver_email: 'test@example.com',
    hj_approver_is: 'HJPetro'
  });
  
  if (projectResult.success) {
    console.log('✅ Project creation test passed');
  } else {
    console.log('❌ Project creation test failed:', projectResult.error);
  }
  
  // Test approval creation
  const approvalService = new (require('./services/approval-service'))();
  const approvalResult = await approvalService.createApprovalRequest(
    ['timesheet1', 'timesheet2'],
    projectResult.projectId,
    'consultant123'
  );
  
  if (approvalResult.success) {
    console.log('✅ Approval creation test passed');
  } else {
    console.log('❌ Approval creation test failed:', approvalResult.error);
  }
  
  console.log('Backend tests completed');
}

// Run initialization
initialize();
```

### **6.3 Run the Backend**
```bash
# Install dependencies
npm install

# Run the backend
node src/index.js
```

## 📊 **Step 7: Validation & Testing**

### **7.1 Data Validation**
- [ ] Test project creation with valid data
- [ ] Test project creation with invalid data
- [ ] Test timesheet retrieval and filtering
- [ ] Test approval creation and processing
- [ ] Test error handling and recovery

### **7.2 API Integration**
- [ ] Test HubSpot API connectivity
- [ ] Test object creation and updates
- [ ] Test search and filtering
- [ ] Test association management
- [ ] Test error scenarios

### **7.3 Business Logic**
- [ ] Test approval workflow end-to-end
- [ ] Test status updates and synchronization
- [ ] Test validation rules
- [ ] Test error handling
- [ ] Test performance

## 🎯 **Success Criteria**

### **Technical Success**
- [ ] All objects can be created and updated
- [ ] All business logic functions work correctly
- [ ] Error handling works for all scenarios
- [ ] API integration is reliable
- [ ] Performance meets requirements

### **Data Success**
- [ ] Data integrity is maintained
- [ ] Object relationships work correctly
- [ ] Status updates are synchronized
- [ ] Validation rules are enforced
- [ ] Error recovery works

---

*This implementation guide ensures the backend is solid and reliable before building the frontend interfaces.*
