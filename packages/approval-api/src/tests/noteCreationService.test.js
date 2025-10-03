/**
 * Tests for Note Creation Service
 * Tests the scalable note creation functionality
 */

const NoteContentRegistry = require('../services/note/NoteContentRegistry');

describe('Note Creation Service', () => {
  let contentRegistry;

  beforeEach(() => {
    contentRegistry = new NoteContentRegistry();
  });

  describe('Content Registry', () => {
    test('should initialize and discover content generators', () => {
      expect(contentRegistry).toBeDefined();
      expect(contentRegistry.noteTypes).toBeDefined();
      expect(contentRegistry.contentTypes).toBeDefined();
    });

    test('should discover available note types', () => {
      const noteTypes = contentRegistry.getAvailableNoteTypes();
      expect(Array.isArray(noteTypes)).toBe(true);
      expect(noteTypes).toContain('approval');
      expect(noteTypes).toContain('timesheet');
    });

    test('should discover available content types for approval', () => {
      const contentTypes = contentRegistry.getAvailableContentTypes('approval');
      expect(Array.isArray(contentTypes)).toBe(true);
      expect(contentTypes).toContain('approvalDecision');
    });

    test('should discover available content types for timesheet', () => {
      const contentTypes = contentRegistry.getAvailableContentTypes('timesheet');
      expect(Array.isArray(contentTypes)).toBe(true);
      expect(contentTypes).toContain('submissionConfirmation');
    });
  });

  describe('Content Generator Access', () => {
    test('should get approval decision content generator', () => {
      const generator = contentRegistry.getContentGenerator('approval', 'approvalDecision');
      expect(generator).toBeDefined();
      expect(generator.metadata).toBeDefined();
      expect(generator.metadata.name).toBe('Approval Decision Note');
      expect(generator.validateData).toBeDefined();
      expect(generator.generateContent).toBeDefined();
    });

    test('should get timesheet submission content generator', () => {
      const generator = contentRegistry.getContentGenerator('timesheet', 'submissionConfirmation');
      expect(generator).toBeDefined();
      expect(generator.metadata).toBeDefined();
      expect(generator.metadata.name).toBe('Timesheet Submission Confirmation Note');
      expect(generator.validateData).toBeDefined();
      expect(generator.generateContent).toBeDefined();
    });

    test('should throw error for unknown note type', () => {
      expect(() => {
        contentRegistry.getContentGenerator('unknown', 'unknown');
      }).toThrow('Content generator not found: unknown:unknown');
    });

    test('should throw error for unknown content type', () => {
      expect(() => {
        contentRegistry.getContentGenerator('approval', 'unknown');
      }).toThrow('Content generator not found: approval:unknown');
    });
  });

  describe('Approval Decision Content Generation', () => {
    let approvalGenerator;

    beforeEach(() => {
      approvalGenerator = contentRegistry.getContentGenerator('approval', 'approvalDecision');
    });

    test('should validate approval decision data correctly', () => {
      const validData = {
        approvalRequestId: 'req-123',
        consultantName: 'John Doe',
        customer: 'Test Customer',
        projectName: 'Test Project',
        projectId: 'proj-123',
        salesDealId: 'deal-123',
        fromDate: '2025-01-01',
        untilDate: '2025-01-07',
        approvalStatus: 'Approved',
        approverFirstName: 'Jane',
        approverLastName: 'Smith',
        approverEmail: 'jane@example.com'
      };

      expect(() => {
        approvalGenerator.validateData(validData);
      }).not.toThrow();
    });

    test('should reject invalid approval decision data', () => {
      const invalidData = {
        consultantName: 'John Doe',
        // Missing required fields
      };

      expect(() => {
        approvalGenerator.validateData(invalidData);
      }).toThrow('Missing required fields for approval decision note');
    });

    test('should generate approval decision content structure', async () => {
      const data = {
        approvalRequestId: 'req-123',
        consultantName: 'John Doe',
        customer: 'Test Customer',
        projectName: 'Test Project',
        projectId: 'proj-123',
        salesDealId: 'deal-123',
        fromDate: '2025-01-01',
        untilDate: '2025-01-07',
        approvalStatus: 'Approved',
        approverFirstName: 'Jane',
        approverLastName: 'Smith',
        approverEmail: 'jane@example.com',
        comment: 'Looks good!'
      };

      // Mock the HubSpot service methods to avoid API calls
      const originalGetSalesDealOwner = approvalGenerator._getSalesDealOwner;
      approvalGenerator._getSalesDealOwner = jest.fn().mockResolvedValue({
        hubspot_owner_id: '75480756'
      });

      const content = await approvalGenerator.generateContent(data);

      expect(content).toHaveProperty('properties');
      expect(content).toHaveProperty('associations');
      expect(content).toHaveProperty('metadata');
      expect(content.properties).toHaveProperty('hs_note_body');
      expect(content.properties.hs_note_body).toContain('John Doe');
      expect(content.properties.hs_note_body).toContain('Approved');
      expect(content.properties.hs_note_body).toContain('Looks good!');
      expect(content.associations).toHaveLength(1);
      expect(content.associations[0].to.id).toBe('deal-123');

      // Restore original method
      approvalGenerator._getSalesDealOwner = originalGetSalesDealOwner;
    });
  });

  describe('Timesheet Submission Content Generation', () => {
    let timesheetGenerator;

    beforeEach(() => {
      timesheetGenerator = contentRegistry.getContentGenerator('timesheet', 'submissionConfirmation');
    });

    test('should validate timesheet submission data correctly', () => {
      const validData = {
        timesheetId: 'ts-123',
        consultantName: 'John Doe',
        projectName: 'Test Project',
        submissionDate: '2025-01-01',
        salesDealId: 'deal-123'
      };

      expect(() => {
        timesheetGenerator.validateData(validData);
      }).not.toThrow();
    });

    test('should reject invalid timesheet submission data', () => {
      const invalidData = {
        consultantName: 'John Doe',
        // Missing required fields
      };

      expect(() => {
        timesheetGenerator.validateData(invalidData);
      }).toThrow('Missing required fields for timesheet submission note');
    });

    test('should generate timesheet submission content', () => {
      const data = {
        timesheetId: 'ts-123',
        consultantName: 'John Doe',
        projectName: 'Test Project',
        submissionDate: '2025-01-01',
        salesDealId: 'deal-123',
        totalHours: '40',
        customer: 'Test Customer',
        wellNames: 'Well A, Well B'
      };

      const content = timesheetGenerator.generateContent(data);

      expect(content).toHaveProperty('properties');
      expect(content).toHaveProperty('associations');
      expect(content).toHaveProperty('metadata');
      expect(content.properties).toHaveProperty('hs_note_body');
      expect(content.properties.hs_note_body).toContain('John Doe');
      expect(content.properties.hs_note_body).toContain('40');
      expect(content.properties.hs_note_body).toContain('Well A, Well B');
      expect(content.associations).toHaveLength(1);
      expect(content.associations[0].to.id).toBe('deal-123');
    });
  });

  describe('Content Generator Metadata', () => {
    test('should have proper metadata for approval decision generator', () => {
      const generator = contentRegistry.getContentGenerator('approval', 'approvalDecision');
      const metadata = generator.metadata;

      expect(metadata.name).toBe('Approval Decision Note');
      expect(metadata.description).toContain('sales deal notes');
      expect(metadata.category).toBe('approval');
      expect(metadata.version).toBe('1.0.0');
      expect(Array.isArray(metadata.requiredFields)).toBe(true);
      expect(metadata.requiredFields).toContain('approvalRequestId');
      expect(metadata.requiredFields).toContain('consultantName');
      expect(metadata.requiredFields).toContain('salesDealId');
    });

    test('should have proper metadata for timesheet submission generator', () => {
      const generator = contentRegistry.getContentGenerator('timesheet', 'submissionConfirmation');
      const metadata = generator.metadata;

      expect(metadata.name).toBe('Timesheet Submission Confirmation Note');
      expect(metadata.description).toContain('timesheet submissions');
      expect(metadata.category).toBe('timesheet');
      expect(metadata.version).toBe('1.0.0');
      expect(Array.isArray(metadata.requiredFields)).toBe(true);
      expect(metadata.requiredFields).toContain('timesheetId');
      expect(metadata.requiredFields).toContain('consultantName');
      expect(metadata.requiredFields).toContain('salesDealId');
    });
  });
});