/**
 * Core Approval Logic - Backend Implementation
 * 
 * This file contains the core business logic for the approval process
 * without any frontend dependencies. All functions are pure backend logic.
 */

// HubSpot API configuration
const HUBSPOT_CONFIG = {
  objectTypes: {
    PROJECTS: 'hj_projects',
    TIMESHEETS: 'hj_timesheets',
    APPROVALS: 'hj_approvals',
    CONTACTS: 'contacts',
    COMPANIES: 'companies'
  },
  properties: {
    PROJECT: {
      NAME: 'hj_project_name',
      APPROVER_EMAIL: 'hj_approver_email',
      APPROVER_NAME: 'hj_approver_name',
      APPROVER_TYPE: 'hj_approver_is',
      APPROVER_ID: 'hj_approver_id',
      STATUS: 'hj_project_status'
    },
    TIMESHEET: {
      CONSULTANT: 'timesheet_consultant_full_name',
      PROJECT_ID: 'timesheet_project_id',
      HOURS: 'timesheet_hours',
      DATE: 'timesheet_date',
      STATUS: 'timesheet_status',
      DESCRIPTION: 'timesheet_description'
    },
    APPROVAL: {
      PROJECT_ID: 'approval_project_id',
      TIMESHEET_IDS: 'approval_timesheet_ids_array',
      STATUS: 'approval_status',
      CONSULTANT_ID: 'approval_consultant_id',
      APPROVER_EMAIL: 'approver_email',
      APPROVER_NAME: 'approver_name',
      APPROVER_TYPE: 'approver_is',
      CREATED_DATE: 'approval_created_date',
      PROCESSED_DATE: 'approval_processed_date'
    }
  }
};

/**
 * Object Validation Functions
 */
class ObjectValidator {
  static validateProject(projectData) {
    const required = [
      HUBSPOT_CONFIG.properties.PROJECT.NAME,
      HUBSPOT_CONFIG.properties.PROJECT.APPROVER_EMAIL,
      HUBSPOT_CONFIG.properties.PROJECT.APPROVER_TYPE
    ];

    const missing = required.filter(field => !projectData[field]);
    if (missing.length > 0) {
      throw new Error(`Missing required project fields: ${missing.join(', ')}`);
    }

    // Validate email format
    if (!this.isValidEmail(projectData[HUBSPOT_CONFIG.properties.PROJECT.APPROVER_EMAIL])) {
      throw new Error('Invalid approver email format');
    }

    // Validate approver type
    const validTypes = ['HJPetro', 'PrimaryContact'];
    if (!validTypes.includes(projectData[HUBSPOT_CONFIG.properties.PROJECT.APPROVER_TYPE])) {
      throw new Error(`Invalid approver type: ${projectData[HUBSPOT_CONFIG.properties.PROJECT.APPROVER_TYPE]}`);
    }

    return { valid: true, data: projectData };
  }

  static validateTimesheet(timesheetData) {
    const required = [
      HUBSPOT_CONFIG.properties.TIMESHEET.CONSULTANT,
      HUBSPOT_CONFIG.properties.TIMESHEET.PROJECT_ID,
      HUBSPOT_CONFIG.properties.TIMESHEET.HOURS
    ];

    const missing = required.filter(field => !timesheetData[field]);
    if (missing.length > 0) {
      throw new Error(`Missing required timesheet fields: ${missing.join(', ')}`);
    }

    // Validate hours
    if (timesheetData[HUBSPOT_CONFIG.properties.TIMESHEET.HOURS] <= 0) {
      throw new Error('Timesheet hours must be greater than 0');
    }

    return { valid: true, data: timesheetData };
  }

  static validateApproval(approvalData) {
    const required = [
      HUBSPOT_CONFIG.properties.APPROVAL.PROJECT_ID,
      HUBSPOT_CONFIG.properties.APPROVAL.TIMESHEET_IDS,
      HUBSPOT_CONFIG.properties.APPROVAL.APPROVER_EMAIL
    ];

    const missing = required.filter(field => !approvalData[field]);
    if (missing.length > 0) {
      throw new Error(`Missing required approval fields: ${missing.join(', ')}`);
    }

    // Validate timesheet IDs
    const timesheetIds = approvalData[HUBSPOT_CONFIG.properties.APPROVAL.TIMESHEET_IDS].split(',');
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

/**
 * Project Management Logic
 */
class ProjectLogic {
  constructor(hubspotClient) {
    this.client = hubspotClient;
  }

  /**
   * Create a new project with approver assignment
   */
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
          [HUBSPOT_CONFIG.properties.PROJECT.STATUS]: 'Active'
        }
      };

      // Create project
      const result = await this.client.crm.objects.hjProjectsApi.create(project);

      // Set up associations if provided
      if (projectData.companyId) {
        await this.associateCompany(result.id, projectData.companyId);
      }

      if (projectData.consultantId) {
        await this.associateConsultant(result.id, projectData.consultantId);
      }

      return {
        success: true,
        data: result,
        projectId: result.id
      };

    } catch (error) {
      console.error('Error creating project:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Assign approver to project
   */
  async assignApprover(projectId, approverData) {
    try {
      const updateData = {
        properties: {
          [HUBSPOT_CONFIG.properties.PROJECT.APPROVER_EMAIL]: approverData.email,
          [HUBSPOT_CONFIG.properties.PROJECT.APPROVER_NAME]: approverData.name,
          [HUBSPOT_CONFIG.properties.PROJECT.APPROVER_TYPE]: approverData.type,
          [HUBSPOT_CONFIG.properties.PROJECT.APPROVER_ID]: approverData.id
        }
      };

      const result = await this.client.crm.objects.hjProjectsApi.update(projectId, updateData);

      return {
        success: true,
        data: result
      };

    } catch (error) {
      console.error('Error assigning approver:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get project with approver details
   */
  async getProjectWithApprover(projectId) {
    try {
      const project = await this.client.crm.objects.hjProjectsApi.getById(projectId);

      // Get approver details if internal
      if (project.properties[HUBSPOT_CONFIG.properties.PROJECT.APPROVER_TYPE] === 'HJPetro') {
        const approverId = project.properties[HUBSPOT_CONFIG.properties.PROJECT.APPROVER_ID];
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
      console.error('Error getting project:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Associate company with project
   */
  async associateCompany(projectId, companyId) {
    try {
      await this.client.crm.associationsApi.create(
        HUBSPOT_CONFIG.objectTypes.PROJECTS,
        projectId,
        HUBSPOT_CONFIG.objectTypes.COMPANIES,
        companyId,
        'project_to_company'
      );

      return { success: true };
    } catch (error) {
      console.error('Error associating company:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Associate consultant with project
   */
  async associateConsultant(projectId, consultantId) {
    try {
      await this.client.crm.associationsApi.create(
        HUBSPOT_CONFIG.objectTypes.PROJECTS,
        projectId,
        HUBSPOT_CONFIG.objectTypes.CONTACTS,
        consultantId,
        'project_to_consultant'
      );

      return { success: true };
    } catch (error) {
      console.error('Error associating consultant:', error);
      return { success: false, error: error.message };
    }
  }
}

/**
 * Timesheet Management Logic
 */
class TimesheetLogic {
  constructor(hubspotClient) {
    this.client = hubspotClient;
  }

  /**
   * Get timesheets for project with filters
   */
  async getTimesheetsForProject(projectId, filters = {}) {
    try {
      const query = {
        objectType: HUBSPOT_CONFIG.objectTypes.TIMESHEETS,
        properties: [
          HUBSPOT_CONFIG.properties.TIMESHEET.CONSULTANT,
          HUBSPOT_CONFIG.properties.TIMESHEET.HOURS,
          HUBSPOT_CONFIG.properties.TIMESHEET.DATE,
          HUBSPOT_CONFIG.properties.TIMESHEET.STATUS,
          HUBSPOT_CONFIG.properties.TIMESHEET.DESCRIPTION
        ],
        filterGroups: [
          {
            filters: [
              {
                propertyName: HUBSPOT_CONFIG.properties.TIMESHEET.PROJECT_ID,
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
          propertyName: HUBSPOT_CONFIG.properties.TIMESHEET.STATUS,
          operator: 'EQ',
          value: filters.status
        });
      }

      // Add date range filter
      if (filters.startDate && filters.endDate) {
        query.filterGroups[0].filters.push({
          propertyName: HUBSPOT_CONFIG.properties.TIMESHEET.DATE,
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
      console.error('Error getting timesheets:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Update timesheet status
   */
  async updateTimesheetStatus(timesheetId, status, reason = '') {
    try {
      const updateData = {
        properties: {
          [HUBSPOT_CONFIG.properties.TIMESHEET.STATUS]: status
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
      console.error('Error updating timesheet status:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Bulk update timesheet status
   */
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
      console.error('Error bulk updating timesheet status:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

/**
 * Approval Processing Logic
 */
class ApprovalLogic {
  constructor(hubspotClient) {
    this.client = hubspotClient;
    this.projectLogic = new ProjectLogic(hubspotClient);
    this.timesheetLogic = new TimesheetLogic(hubspotClient);
  }

  /**
   * Create approval request
   */
  async createApprovalRequest(timesheetIds, projectId, consultantId) {
    try {
      // Get project details
      const projectResult = await this.projectLogic.getProjectWithApprover(projectId);
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
          [HUBSPOT_CONFIG.properties.APPROVAL.PROJECT_ID]: projectId,
          [HUBSPOT_CONFIG.properties.APPROVAL.TIMESHEET_IDS]: timesheetIds.join(','),
          [HUBSPOT_CONFIG.properties.APPROVAL.STATUS]: 'Pending',
          [HUBSPOT_CONFIG.properties.APPROVAL.CONSULTANT_ID]: consultantId,
          [HUBSPOT_CONFIG.properties.APPROVAL.APPROVER_EMAIL]: project.properties[HUBSPOT_CONFIG.properties.PROJECT.APPROVER_EMAIL],
          [HUBSPOT_CONFIG.properties.APPROVAL.APPROVER_NAME]: project.properties[HUBSPOT_CONFIG.properties.PROJECT.APPROVER_NAME],
          [HUBSPOT_CONFIG.properties.APPROVAL.APPROVER_TYPE]: project.properties[HUBSPOT_CONFIG.properties.PROJECT.APPROVER_TYPE],
          [HUBSPOT_CONFIG.properties.APPROVAL.CREATED_DATE]: new Date().toISOString()
        }
      };

      const result = await this.client.crm.objects.hjApprovalsApi.create(approval);

      // Update timesheet status
      const timesheetResult = await this.timesheetLogic.updateTimesheetStatusBulk(
        timesheetIds,
        'Submitted for Approval'
      );

      if (!timesheetResult.success) {
        throw new Error(`Failed to update timesheet status: ${timesheetResult.error}`);
      }

      // Send notification (this would trigger a workflow)
      await this.sendApprovalNotification(result.id);

      return {
        success: true,
        data: result,
        approvalId: result.id
      };

    } catch (error) {
      console.error('Error creating approval request:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Process approval decision
   */
  async processApprovalDecision(approvalId, decision, comments = '') {
    try {
      // Get approval details
      const approval = await this.client.crm.objects.hjApprovalsApi.getById(approvalId);

      // Update approval status
      const updateData = {
        properties: {
          [HUBSPOT_CONFIG.properties.APPROVAL.STATUS]: decision,
          [HUBSPOT_CONFIG.properties.APPROVAL.PROCESSED_DATE]: new Date().toISOString()
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
      const timesheetIds = approval.properties[HUBSPOT_CONFIG.properties.APPROVAL.TIMESHEET_IDS].split(',');
      const timesheetResult = await this.timesheetLogic.updateTimesheetStatusBulk(
        timesheetIds,
        decision,
        comments
      );

      if (!timesheetResult.success) {
        throw new Error(`Failed to update timesheet status: ${timesheetResult.error}`);
      }

      // Send confirmation notification
      await this.sendApprovalConfirmation(approvalId, decision);

      return {
        success: true,
        approvalId,
        decision
      };

    } catch (error) {
      console.error('Error processing approval decision:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get pending approvals
   */
  async getPendingApprovals(filters = {}) {
    try {
      const query = {
        objectType: HUBSPOT_CONFIG.objectTypes.APPROVALS,
        properties: [
          HUBSPOT_CONFIG.properties.APPROVAL.PROJECT_ID,
          HUBSPOT_CONFIG.properties.APPROVAL.TIMESHEET_IDS,
          HUBSPOT_CONFIG.properties.APPROVAL.STATUS,
          HUBSPOT_CONFIG.properties.APPROVAL.APPROVER_EMAIL,
          HUBSPOT_CONFIG.properties.APPROVAL.APPROVER_NAME,
          HUBSPOT_CONFIG.properties.APPROVAL.CREATED_DATE
        ],
        filterGroups: [
          {
            filters: [
              {
                propertyName: HUBSPOT_CONFIG.properties.APPROVAL.STATUS,
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
          propertyName: HUBSPOT_CONFIG.properties.APPROVAL.APPROVER_EMAIL,
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
      console.error('Error getting pending approvals:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Send approval notification (placeholder for workflow trigger)
   */
  async sendApprovalNotification(approvalId) {
    // This would trigger a HubSpot workflow
    // For now, just log the action
    console.log(`Sending approval notification for approval ID: ${approvalId}`);
    return { success: true };
  }

  /**
   * Send approval confirmation (placeholder for workflow trigger)
   */
  async sendApprovalConfirmation(approvalId, decision) {
    // This would trigger a HubSpot workflow
    // For now, just log the action
    console.log(`Sending approval confirmation for approval ID: ${approvalId}, decision: ${decision}`);
    return { success: true };
  }
}

/**
 * Main Approval System Class
 */
class ApprovalSystem {
  constructor(hubspotClient) {
    this.client = hubspotClient;
    this.projectLogic = new ProjectLogic(hubspotClient);
    this.timesheetLogic = new TimesheetLogic(hubspotClient);
    this.approvalLogic = new ApprovalLogic(hubspotClient);
  }

  /**
   * Get system status
   */
  async getSystemStatus() {
    try {
      // Test basic connectivity
      const projects = await this.client.crm.objects.hjProjectsApi.getPage(1);
      const timesheets = await this.client.crm.objects.hjTimesheetsApi.getPage(1);
      const approvals = await this.client.crm.objects.hjApprovalsApi.getPage(1);

      return {
        success: true,
        status: 'operational',
        objects: {
          projects: projects.total,
          timesheets: timesheets.total,
          approvals: approvals.total
        }
      };

    } catch (error) {
      console.error('Error getting system status:', error);
      return {
        success: false,
        status: 'error',
        error: error.message
      };
    }
  }
}

// Export classes for use in other modules
module.exports = {
  ObjectValidator,
  ProjectLogic,
  TimesheetLogic,
  ApprovalLogic,
  ApprovalSystem,
  HUBSPOT_CONFIG
};
