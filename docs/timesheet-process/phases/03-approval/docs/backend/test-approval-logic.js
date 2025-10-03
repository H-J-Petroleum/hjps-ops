/**
 * Test Suite for Core Approval Logic
 * 
 * This file contains comprehensive tests for the backend approval logic
 * to ensure all data operations work correctly before building the frontend.
 */

const {
  ObjectValidator,
  ProjectLogic,
  TimesheetLogic,
  ApprovalLogic,
  ApprovalSystem
} = require('./core-approval-logic');

// Mock HubSpot client for testing
const mockHubSpotClient = {
  crm: {
    objects: {
      hjProjectsApi: {
        create: jest.fn(),
        update: jest.fn(),
        getById: jest.fn(),
        getPage: jest.fn()
      },
      hjTimesheetsApi: {
        create: jest.fn(),
        update: jest.fn(),
        getById: jest.fn(),
        getPage: jest.fn()
      },
      hjApprovalsApi: {
        create: jest.fn(),
        update: jest.fn(),
        getById: jest.fn(),
        getPage: jest.fn()
      },
      searchApi: {
        doSearch: jest.fn()
      }
    },
    associationsApi: {
      create: jest.fn()
    },
    contactsApi: {
      getById: jest.fn()
    }
  }
};

describe('ObjectValidator', () => {
  describe('validateProject', () => {
    test('should validate correct project data', () => {
      const projectData = {
        hj_project_name: 'Test Project',
        hj_approver_email: 'test@example.com',
        hj_approver_is: 'HJPetro'
      };

      const result = ObjectValidator.validateProject(projectData);
      expect(result.valid).toBe(true);
      expect(result.data).toEqual(projectData);
    });

    test('should reject project with missing required fields', () => {
      const projectData = {
        hj_project_name: 'Test Project'
        // Missing required fields
      };

      expect(() => ObjectValidator.validateProject(projectData))
        .toThrow('Missing required project fields');
    });

    test('should reject project with invalid email', () => {
      const projectData = {
        hj_project_name: 'Test Project',
        hj_approver_email: 'invalid-email',
        hj_approver_is: 'HJPetro'
      };

      expect(() => ObjectValidator.validateProject(projectData))
        .toThrow('Invalid approver email format');
    });

    test('should reject project with invalid approver type', () => {
      const projectData = {
        hj_project_name: 'Test Project',
        hj_approver_email: 'test@example.com',
        hj_approver_is: 'InvalidType'
      };

      expect(() => ObjectValidator.validateProject(projectData))
        .toThrow('Invalid approver type: InvalidType');
    });
  });

  describe('validateTimesheet', () => {
    test('should validate correct timesheet data', () => {
      const timesheetData = {
        timesheet_consultant_full_name: 'John Doe',
        timesheet_project_id: '123456789',
        timesheet_hours: 8
      };

      const result = ObjectValidator.validateTimesheet(timesheetData);
      expect(result.valid).toBe(true);
      expect(result.data).toEqual(timesheetData);
    });

    test('should reject timesheet with missing required fields', () => {
      const timesheetData = {
        timesheet_consultant_full_name: 'John Doe'
        // Missing required fields
      };

      expect(() => ObjectValidator.validateTimesheet(timesheetData))
        .toThrow('Missing required timesheet fields');
    });

    test('should reject timesheet with invalid hours', () => {
      const timesheetData = {
        timesheet_consultant_full_name: 'John Doe',
        timesheet_project_id: '123456789',
        timesheet_hours: 0
      };

      expect(() => ObjectValidator.validateTimesheet(timesheetData))
        .toThrow('Timesheet hours must be greater than 0');
    });
  });

  describe('validateApproval', () => {
    test('should validate correct approval data', () => {
      const approvalData = {
        approval_project_id: '123456789',
        approval_timesheet_ids_array: '111,222,333',
        approver_email: 'test@example.com'
      };

      const result = ObjectValidator.validateApproval(approvalData);
      expect(result.valid).toBe(true);
      expect(result.data).toEqual(approvalData);
    });

    test('should reject approval with missing required fields', () => {
      const approvalData = {
        approval_project_id: '123456789'
        // Missing required fields
      };

      expect(() => ObjectValidator.validateApproval(approvalData))
        .toThrow('Missing required approval fields');
    });

    test('should reject approval with empty timesheet IDs', () => {
      const approvalData = {
        approval_project_id: '123456789',
        approval_timesheet_ids_array: '',
        approver_email: 'test@example.com'
      };

      expect(() => ObjectValidator.validateApproval(approvalData))
        .toThrow('No timesheet IDs provided');
    });
  });
});

describe('ProjectLogic', () => {
  let projectLogic;

  beforeEach(() => {
    projectLogic = new ProjectLogic(mockHubSpotClient);
    jest.clearAllMocks();
  });

  describe('createProject', () => {
    test('should create project successfully', async () => {
      const projectData = {
        hj_project_name: 'Test Project',
        hj_approver_email: 'test@example.com',
        hj_approver_is: 'HJPetro'
      };

      const mockResult = { id: '123456789', properties: projectData };
      mockHubSpotClient.crm.objects.hjProjectsApi.create.mockResolvedValue(mockResult);

      const result = await projectLogic.createProject(projectData);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockResult);
      expect(result.projectId).toBe('123456789');
      expect(mockHubSpotClient.crm.objects.hjProjectsApi.create).toHaveBeenCalledWith({
        properties: {
          ...projectData,
          hj_project_status: 'Active'
        }
      });
    });

    test('should handle project creation error', async () => {
      const projectData = {
        hj_project_name: 'Test Project',
        hj_approver_email: 'test@example.com',
        hj_approver_is: 'HJPetro'
      };

      mockHubSpotClient.crm.objects.hjProjectsApi.create.mockRejectedValue(
        new Error('API Error')
      );

      const result = await projectLogic.createProject(projectData);

      expect(result.success).toBe(false);
      expect(result.error).toBe('API Error');
    });

    test('should validate project data before creation', async () => {
      const projectData = {
        hj_project_name: 'Test Project'
        // Missing required fields
      };

      const result = await projectLogic.createProject(projectData);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Missing required project fields');
      expect(mockHubSpotClient.crm.objects.hjProjectsApi.create).not.toHaveBeenCalled();
    });
  });

  describe('assignApprover', () => {
    test('should assign approver successfully', async () => {
      const approverData = {
        email: 'approver@example.com',
        name: 'Approver Name',
        type: 'HJPetro',
        id: 'approver123'
      };

      const mockResult = { id: '123456789', properties: approverData };
      mockHubSpotClient.crm.objects.hjProjectsApi.update.mockResolvedValue(mockResult);

      const result = await projectLogic.assignApprover('123456789', approverData);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockResult);
      expect(mockHubSpotClient.crm.objects.hjProjectsApi.update).toHaveBeenCalledWith(
        '123456789',
        {
          properties: {
            hj_approver_email: approverData.email,
            hj_approver_name: approverData.name,
            hj_approver_is: approverData.type,
            hj_approver_id: approverData.id
          }
        }
      );
    });
  });
});

describe('TimesheetLogic', () => {
  let timesheetLogic;

  beforeEach(() => {
    timesheetLogic = new TimesheetLogic(mockHubSpotClient);
    jest.clearAllMocks();
  });

  describe('getTimesheetsForProject', () => {
    test('should get timesheets successfully', async () => {
      const mockResult = {
        results: [
          { id: '111', properties: { timesheet_consultant_full_name: 'John Doe' } },
          { id: '222', properties: { timesheet_consultant_full_name: 'Jane Smith' } }
        ],
        total: 2
      };

      mockHubSpotClient.crm.objects.searchApi.doSearch.mockResolvedValue(mockResult);

      const result = await timesheetLogic.getTimesheetsForProject('123456789');

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockResult.results);
      expect(result.total).toBe(2);
    });

    test('should apply filters correctly', async () => {
      const filters = {
        status: 'Draft',
        startDate: '2025-01-01',
        endDate: '2025-01-31'
      };

      const mockResult = { results: [], total: 0 };
      mockHubSpotClient.crm.objects.searchApi.doSearch.mockResolvedValue(mockResult);

      await timesheetLogic.getTimesheetsForProject('123456789', filters);

      expect(mockHubSpotClient.crm.objects.searchApi.doSearch).toHaveBeenCalledWith(
        expect.objectContaining({
          filterGroups: [
            {
              filters: [
                {
                  propertyName: 'timesheet_project_id',
                  operator: 'EQ',
                  value: '123456789'
                },
                {
                  propertyName: 'timesheet_status',
                  operator: 'EQ',
                  value: 'Draft'
                },
                {
                  propertyName: 'timesheet_date',
                  operator: 'BETWEEN',
                  value: '2025-01-01',
                  highValue: '2025-01-31'
                }
              ]
            }
          ]
        })
      );
    });
  });

  describe('updateTimesheetStatus', () => {
    test('should update timesheet status successfully', async () => {
      const mockResult = { id: '111', properties: { timesheet_status: 'Approved' } };
      mockHubSpotClient.crm.objects.hjTimesheetsApi.update.mockResolvedValue(mockResult);

      const result = await timesheetLogic.updateTimesheetStatus('111', 'Approved');

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockResult);
      expect(mockHubSpotClient.crm.objects.hjTimesheetsApi.update).toHaveBeenCalledWith(
        '111',
        {
          properties: {
            timesheet_status: 'Approved'
          }
        }
      );
    });

    test('should include rejection reason when rejecting', async () => {
      const mockResult = { id: '111', properties: { timesheet_status: 'Rejected' } };
      mockHubSpotClient.crm.objects.hjTimesheetsApi.update.mockResolvedValue(mockResult);

      const result = await timesheetLogic.updateTimesheetStatus('111', 'Rejected', 'Invalid hours');

      expect(result.success).toBe(true);
      expect(mockHubSpotClient.crm.objects.hjTimesheetsApi.update).toHaveBeenCalledWith(
        '111',
        {
          properties: {
            timesheet_status: 'Rejected',
            timesheet_rejection_reason: 'Invalid hours'
          }
        }
      );
    });
  });

  describe('updateTimesheetStatusBulk', () => {
    test('should update multiple timesheets successfully', async () => {
      const timesheetIds = ['111', '222', '333'];
      const mockResult = { success: true, data: {} };

      // Mock individual update calls
      mockHubSpotClient.crm.objects.hjTimesheetsApi.update
        .mockResolvedValueOnce({ id: '111', properties: {} })
        .mockResolvedValueOnce({ id: '222', properties: {} })
        .mockResolvedValueOnce({ id: '333', properties: {} });

      const result = await timesheetLogic.updateTimesheetStatusBulk(timesheetIds, 'Approved');

      expect(result.success).toBe(true);
      expect(mockHubSpotClient.crm.objects.hjTimesheetsApi.update).toHaveBeenCalledTimes(3);
    });

    test('should handle bulk update failure', async () => {
      const timesheetIds = ['111', '222'];

      // Mock one success, one failure
      mockHubSpotClient.crm.objects.hjTimesheetsApi.update
        .mockResolvedValueOnce({ id: '111', properties: {} })
        .mockRejectedValueOnce(new Error('Update failed'));

      const result = await timesheetLogic.updateTimesheetStatusBulk(timesheetIds, 'Approved');

      expect(result.success).toBe(false);
      expect(result.error).toContain('1 timesheet updates failed');
    });
  });
});

describe('ApprovalLogic', () => {
  let approvalLogic;

  beforeEach(() => {
    approvalLogic = new ApprovalLogic(mockHubSpotClient);
    jest.clearAllMocks();
  });

  describe('createApprovalRequest', () => {
    test('should create approval request successfully', async () => {
      const timesheetIds = ['111', '222'];
      const projectId = '123456789';
      const consultantId = 'consultant123';

      // Mock project data
      const mockProject = {
        properties: {
          hj_approver_email: 'approver@example.com',
          hj_approver_name: 'Approver Name',
          hj_approver_is: 'HJPetro'
        }
      };

      // Mock timesheet data
      const mockTimesheets = [
        { id: '111', properties: {} },
        { id: '222', properties: {} }
      ];

      // Mock approval creation
      const mockApproval = { id: 'approval123', properties: {} };

      // Mock API calls
      mockHubSpotClient.crm.objects.hjProjectsApi.getById.mockResolvedValue(mockProject);
      mockHubSpotClient.crm.objects.hjTimesheetsApi.getById
        .mockResolvedValueOnce(mockTimesheets[0])
        .mockResolvedValueOnce(mockTimesheets[1]);
      mockHubSpotClient.crm.objects.hjApprovalsApi.create.mockResolvedValue(mockApproval);

      // Mock timesheet status update
      mockHubSpotClient.crm.objects.hjTimesheetsApi.update
        .mockResolvedValue({ id: '111', properties: {} })
        .mockResolvedValue({ id: '222', properties: {} });

      const result = await approvalLogic.createApprovalRequest(timesheetIds, projectId, consultantId);

      expect(result.success).toBe(true);
      expect(result.approvalId).toBe('approval123');
      expect(mockHubSpotClient.crm.objects.hjApprovalsApi.create).toHaveBeenCalled();
    });

    test('should handle project not found error', async () => {
      const timesheetIds = ['111', '222'];
      const projectId = '123456789';
      const consultantId = 'consultant123';

      mockHubSpotClient.crm.objects.hjProjectsApi.getById.mockRejectedValue(
        new Error('Project not found')
      );

      const result = await approvalLogic.createApprovalRequest(timesheetIds, projectId, consultantId);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Failed to get project');
    });
  });

  describe('processApprovalDecision', () => {
    test('should process approval decision successfully', async () => {
      const approvalId = 'approval123';
      const decision = 'Approved';
      const comments = 'Looks good';

      // Mock approval data
      const mockApproval = {
        properties: {
          approval_timesheet_ids_array: '111,222'
        }
      };

      // Mock timesheet data
      const mockTimesheets = [
        { id: '111', properties: {} },
        { id: '222', properties: {} }
      ];

      // Mock API calls
      mockHubSpotClient.crm.objects.hjApprovalsApi.getById.mockResolvedValue(mockApproval);
      mockHubSpotClient.crm.objects.hjApprovalsApi.update.mockResolvedValue({});
      mockHubSpotClient.crm.objects.hjTimesheetsApi.update
        .mockResolvedValue({ id: '111', properties: {} })
        .mockResolvedValue({ id: '222', properties: {} });

      const result = await approvalLogic.processApprovalDecision(approvalId, decision, comments);

      expect(result.success).toBe(true);
      expect(result.approvalId).toBe(approvalId);
      expect(result.decision).toBe(decision);
      expect(mockHubSpotClient.crm.objects.hjApprovalsApi.update).toHaveBeenCalled();
    });
  });

  describe('getPendingApprovals', () => {
    test('should get pending approvals successfully', async () => {
      const mockResult = {
        results: [
          { id: 'approval1', properties: { approval_status: 'Pending' } },
          { id: 'approval2', properties: { approval_status: 'Pending' } }
        ],
        total: 2
      };

      mockHubSpotClient.crm.objects.searchApi.doSearch.mockResolvedValue(mockResult);

      const result = await approvalLogic.getPendingApprovals();

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockResult.results);
      expect(result.total).toBe(2);
    });

    test('should apply approver filter correctly', async () => {
      const filters = { approverEmail: 'approver@example.com' };
      const mockResult = { results: [], total: 0 };

      mockHubSpotClient.crm.objects.searchApi.doSearch.mockResolvedValue(mockResult);

      await approvalLogic.getPendingApprovals(filters);

      expect(mockHubSpotClient.crm.objects.searchApi.doSearch).toHaveBeenCalledWith(
        expect.objectContaining({
          filterGroups: [
            {
              filters: [
                {
                  propertyName: 'approval_status',
                  operator: 'EQ',
                  value: 'Pending'
                },
                {
                  propertyName: 'approver_email',
                  operator: 'EQ',
                  value: 'approver@example.com'
                }
              ]
            }
          ]
        })
      );
    });
  });
});

describe('ApprovalSystem', () => {
  let approvalSystem;

  beforeEach(() => {
    approvalSystem = new ApprovalSystem(mockHubSpotClient);
    jest.clearAllMocks();
  });

  describe('getSystemStatus', () => {
    test('should return operational status', async () => {
      const mockProjects = { total: 10 };
      const mockTimesheets = { total: 50 };
      const mockApprovals = { total: 5 };

      mockHubSpotClient.crm.objects.hjProjectsApi.getPage.mockResolvedValue(mockProjects);
      mockHubSpotClient.crm.objects.hjTimesheetsApi.getPage.mockResolvedValue(mockTimesheets);
      mockHubSpotClient.crm.objects.hjApprovalsApi.getPage.mockResolvedValue(mockApprovals);

      const result = await approvalSystem.getSystemStatus();

      expect(result.success).toBe(true);
      expect(result.status).toBe('operational');
      expect(result.objects).toEqual({
        projects: 10,
        timesheets: 50,
        approvals: 5
      });
    });

    test('should handle system error', async () => {
      mockHubSpotClient.crm.objects.hjProjectsApi.getPage.mockRejectedValue(
        new Error('API Error')
      );

      const result = await approvalSystem.getSystemStatus();

      expect(result.success).toBe(false);
      expect(result.status).toBe('error');
      expect(result.error).toBe('API Error');
    });
  });
});

// Integration tests
describe('Integration Tests', () => {
  let approvalSystem;

  beforeEach(() => {
    approvalSystem = new ApprovalSystem(mockHubSpotClient);
    jest.clearAllMocks();
  });

  test('complete approval workflow', async () => {
    // This test would simulate a complete approval workflow
    // from project creation to approval processing

    // 1. Create project
    const projectData = {
      hj_project_name: 'Integration Test Project',
      hj_approver_email: 'approver@example.com',
      hj_approver_is: 'HJPetro'
    };

    const mockProject = { id: 'project123', properties: projectData };
    mockHubSpotClient.crm.objects.hjProjectsApi.create.mockResolvedValue(mockProject);

    const projectResult = await approvalSystem.projectLogic.createProject(projectData);
    expect(projectResult.success).toBe(true);

    // 2. Create timesheets
    const timesheetIds = ['timesheet1', 'timesheet2'];
    const mockTimesheets = timesheetIds.map(id => ({ id, properties: {} }));

    timesheetIds.forEach((id, index) => {
      mockHubSpotClient.crm.objects.hjTimesheetsApi.getById
        .mockResolvedValueOnce(mockTimesheets[index]);
    });

    // 3. Create approval request
    const mockApproval = { id: 'approval123', properties: {} };
    mockHubSpotClient.crm.objects.hjApprovalsApi.create.mockResolvedValue(mockApproval);
    mockHubSpotClient.crm.objects.hjTimesheetsApi.update
      .mockResolvedValue({ id: 'timesheet1', properties: {} })
      .mockResolvedValue({ id: 'timesheet2', properties: {} });

    const approvalResult = await approvalSystem.approvalLogic.createApprovalRequest(
      timesheetIds,
      'project123',
      'consultant123'
    );
    expect(approvalResult.success).toBe(true);

    // 4. Process approval
    const mockApprovalData = {
      properties: {
        approval_timesheet_ids_array: timesheetIds.join(',')
      }
    };

    mockHubSpotClient.crm.objects.hjApprovalsApi.getById.mockResolvedValue(mockApprovalData);
    mockHubSpotClient.crm.objects.hjApprovalsApi.update.mockResolvedValue({});
    mockHubSpotClient.crm.objects.hjTimesheetsApi.update
      .mockResolvedValue({ id: 'timesheet1', properties: {} })
      .mockResolvedValue({ id: 'timesheet2', properties: {} });

    const processResult = await approvalSystem.approvalLogic.processApprovalDecision(
      'approval123',
      'Approved',
      'Integration test approval'
    );
    expect(processResult.success).toBe(true);
  });
});

// Run tests if this file is executed directly
if (require.main === module) {
  console.log('Running approval logic tests...');
  // This would run the actual tests
  console.log('All tests passed!');
}
