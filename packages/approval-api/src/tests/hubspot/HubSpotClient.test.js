/**
 * Tests for HubSpotClient (Toolkit Integration)
 * Verifies the toolkit-based HubSpot client wrapper
 */

const { HubSpotClient } = require('../../services/hubspot');
const { createTestLogger, logTestError, captureLoggerOutput } = require('../../utils/testLogger');

// Mock the toolkit client
jest.mock('@hjps/toolkit-hubspot', () => ({
  HubSpotClient: jest.fn().mockImplementation(() => ({
    config: {
      portalId: '1230608',
      environment: 'production',
      objectTypes: {
        approval: '2-26103010',
        timesheet: '2-26173281',
        project: '2-xxxxxxxx',
        contact: '0-1',
        deal: '0-3',
        company: '0-2'
      }
    },
    getObject: jest.fn(),
    getObjectBatch: jest.fn(),
    updateObject: jest.fn(),
    updateObjectBatch: jest.fn(),
    createObject: jest.fn(),
    search: jest.fn()
  })),
  validateEnvironment: jest.fn().mockResolvedValue({
    valid: true,
    config: {
      portalId: '1230608',
      environment: 'production'
    }
  })
}));

describe('HubSpotClient', () => {
  let client;
  let mockToolkitClient;
  let testLogger;
  let logCapture;

  beforeAll(() => {
    testLogger = createTestLogger({ testName: 'HubSpotClient', level: 'debug' });
  });

  beforeEach(() => {
    jest.clearAllMocks();

    // Get the mock toolkit client
    const { HubSpotClient: MockToolkit } = require('@hjps/toolkit-hubspot');
    mockToolkitClient = new MockToolkit();

    // Create client instance
    client = new HubSpotClient({
      environment: 'production',
      token: 'test-token',
      logger: testLogger
    });

    // Capture logs for assertions
    logCapture = captureLoggerOutput(testLogger);

    testLogger.info('Test setup complete', { testName: expect.getState().currentTestName });
  });

  afterEach(() => {
    logCapture.stop();

    testLogger.info('Test teardown', {
      testName: expect.getState().currentTestName,
      logsGenerated: logCapture.logs.length
    });
  });

  describe('getApprovalObject', () => {
    it('should retrieve approval by HubSpot ID', async () => {
      const mockApproval = {
        id: '123456',
        properties: {
          approval_request_id: 'AR-12345',
          project_name: 'Test Project'
        }
      };

      mockToolkitClient.getObject.mockResolvedValue(mockApproval);

      try {
        const result = await client.getApprovalObject('123456');

        expect(result).toEqual(mockApproval);
        expect(mockToolkitClient.getObject).toHaveBeenCalledWith(
          'approval',
          '123456',
          expect.objectContaining({
            properties: expect.any(Array),
            fallbackSearch: expect.any(Object)
          })
        );

        testLogger.info('Successfully retrieved approval', { approvalId: result.id });
      } catch (error) {
        logTestError(testLogger, error, { approvalId: '123456' });
        throw error;
      }
    });

    it('should handle approval not found gracefully', async () => {
      mockToolkitClient.getObject.mockRejectedValue(
        new Error('Approval not found')
      );

      try {
        const result = await client.getApprovalObject('invalid-id');

        expect(result).toBeNull();

        // Verify warning was logged
        const errorLogs = logCapture.getErrorLogs();
        expect(errorLogs.length).toBeGreaterThan(0);

        testLogger.info('Handled missing approval correctly');
      } catch (error) {
        logTestError(testLogger, error, { testCase: 'approval-not-found' });
        throw error;
      }
    });

    it('should log detailed error context on failure', async () => {
      const mockError = new Error('API Error');
      mockError.response = {
        status: 500,
        data: { message: 'Internal Server Error' }
      };

      mockToolkitClient.getObject.mockRejectedValue(mockError);

      try {
        await client.getApprovalObject('123456');
      } catch (error) {
        // Expected to fail - verify error logging
        const errorLogs = logCapture.getErrorLogs();
        expect(errorLogs.length).toBeGreaterThan(0);

        // Check that error context was logged
        const lastLog = logCapture.getLastLog();
        expect(lastLog).toContain('API Error');

        testLogger.info('Error logging verified', {
          errorLogsCount: errorLogs.length
        });
      }
    });
  });

  describe('getTimesheets', () => {
    it('should retrieve multiple timesheets in batch', async () => {
      const mockTimesheets = [
        { id: '1', properties: { timesheet_project_name: 'Project A' } },
        { id: '2', properties: { timesheet_project_name: 'Project B' } }
      ];

      mockToolkitClient.getObjectBatch.mockResolvedValue(mockTimesheets);

      try {
        const result = await client.getTimesheets(['1', '2']);

        expect(result).toHaveLength(2);
        expect(result).toEqual(mockTimesheets);
        expect(mockToolkitClient.getObjectBatch).toHaveBeenCalledWith(
          'timesheet',
          ['1', '2'],
          expect.objectContaining({
            properties: expect.any(Array),
            continueOnError: true
          })
        );

        testLogger.info('Batch retrieval successful', {
          timesheetsRetrieved: result.length
        });
      } catch (error) {
        logTestError(testLogger, error, { timesheetIds: ['1', '2'] });
        throw error;
      }
    });

    it('should filter out failed results from batch', async () => {
      const mockResults = [
        { id: '1', properties: {} },
        { error: 'Not found', id: '2' },
        { id: '3', properties: {} }
      ];

      mockToolkitClient.getObjectBatch.mockResolvedValue(mockResults);

      try {
        const result = await client.getTimesheets(['1', '2', '3']);

        expect(result).toHaveLength(2);
        expect(result.every(r => !r.error)).toBe(true);

        testLogger.info('Filtered batch results', {
          requested: 3,
          successful: result.length,
          failed: 1
        });
      } catch (error) {
        logTestError(testLogger, error, { testCase: 'batch-filtering' });
        throw error;
      }
    });
  });

  describe('findTimesheetsByApprovalRequestId', () => {
    it('should search for timesheets by approval request ID', async () => {
      const mockResults = {
        results: [
          { id: '1' },
          { id: '2' },
          { id: '3' }
        ]
      };

      mockToolkitClient.search.mockResolvedValue(mockResults);

      try {
        const result = await client.findTimesheetsByApprovalRequestId('AR-12345');

        expect(result).toEqual(['1', '2', '3']);
        expect(mockToolkitClient.search).toHaveBeenCalledWith(
          'timesheet',
          expect.objectContaining({
            filterGroups: expect.any(Array),
            limit: 100
          })
        );

        testLogger.info('Search completed', {
          approvalRequestId: 'AR-12345',
          timesheetsFound: result.length
        });
      } catch (error) {
        logTestError(testLogger, error, { approvalRequestId: 'AR-12345' });
        throw error;
      }
    });

    it('should return empty array when no timesheets found', async () => {
      mockToolkitClient.search.mockResolvedValue({ results: [] });

      try {
        const result = await client.findTimesheetsByApprovalRequestId('AR-NOTFOUND');

        expect(result).toEqual([]);

        testLogger.info('No timesheets found - returned empty array');
      } catch (error) {
        logTestError(testLogger, error);
        throw error;
      }
    });

    it('should handle search failures gracefully', async () => {
      mockToolkitClient.search.mockRejectedValue(new Error('Search failed'));

      try {
        const result = await client.findTimesheetsByApprovalRequestId('AR-12345');

        expect(result).toEqual([]);

        const errorLogs = logCapture.getErrorLogs();
        expect(errorLogs.length).toBeGreaterThan(0);

        testLogger.info('Search failure handled gracefully');
      } catch (error) {
        logTestError(testLogger, error);
        throw error;
      }
    });
  });

  describe('updateApprovalObject', () => {
    it('should update approval properties', async () => {
      const mockUpdated = {
        id: '123456',
        properties: {
          approval_status: 'approved',
          approval_date: '2025-10-03'
        }
      };

      mockToolkitClient.updateObject.mockResolvedValue(mockUpdated);

      try {
        const result = await client.updateApprovalObject('123456', {
          approval_status: 'approved',
          approval_date: '2025-10-03'
        });

        expect(result).toEqual(mockUpdated);
        expect(mockToolkitClient.updateObject).toHaveBeenCalledWith(
          'approval',
          '123456',
          expect.any(Object)
        );

        testLogger.info('Approval updated successfully', {
          approvalId: '123456',
          propertiesUpdated: 2
        });
      } catch (error) {
        logTestError(testLogger, error, { approvalId: '123456' });
        throw error;
      }
    });

    it('should log detailed error on update failure', async () => {
      const mockError = new Error('Update failed');
      mockError.response = { status: 400, data: { message: 'Invalid properties' } };

      mockToolkitClient.updateObject.mockRejectedValue(mockError);

      try {
        await client.updateApprovalObject('123456', { invalid_prop: 'value' });
        fail('Should have thrown error');
      } catch (error) {
        expect(error.message).toContain('Update failed');

        const errorLogs = logCapture.getErrorLogs();
        expect(errorLogs.length).toBeGreaterThan(0);

        testLogger.info('Update error logged correctly');
      }
    });
  });

  describe('validateEnvironment', () => {
    it('should validate environment successfully', async () => {
      const { validateEnvironment } = require('@hjps/toolkit-hubspot');
      validateEnvironment.mockResolvedValue({
        valid: true,
        config: { portalId: '1230608' }
      });

      try {
        const result = await client.validateEnvironment();

        expect(result.valid).toBe(true);
        expect(result.config.portalId).toBe('1230608');

        testLogger.info('Environment validated', { portalId: result.config.portalId });
      } catch (error) {
        logTestError(testLogger, error);
        throw error;
      }
    });

    it('should throw error on invalid environment', async () => {
      const { validateEnvironment } = require('@hjps/toolkit-hubspot');
      validateEnvironment.mockResolvedValue({
        valid: false,
        errors: ['Invalid portal ID', 'Missing object types']
      });

      try {
        await client.validateEnvironment();
        fail('Should have thrown error');
      } catch (error) {
        expect(error.message).toContain('Invalid HubSpot environment');

        const errorLogs = logCapture.getErrorLogs();
        expect(errorLogs.length).toBeGreaterThan(0);

        testLogger.info('Invalid environment handled correctly');
      }
    });
  });
});
