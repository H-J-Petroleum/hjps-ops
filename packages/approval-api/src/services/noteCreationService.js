/**
 * Generic Note Creation Service
 * Scalable service for creating various types of notes in HubSpot
 * 
 * This service provides a generic framework for creating notes with:
 * - Flexible content generation
 * - Multiple association types
 * - Configurable properties
 * - Attachment support
 * - Error handling
 */

const HubSpotService = require('./hubspotService');
const NoteContentRegistry = require('./note/NoteContentRegistry');
const logger = require('../utils/logger');

class NoteCreationService {
  constructor() {
    this.hubspotService = new HubSpotService();
    this.contentRegistry = new NoteContentRegistry();
  }

  /**
   * Create a note using a specific content generator
   * 
   * @param {string} noteType - Type of note (e.g., 'approval', 'timesheet', 'project')
   * @param {string} contentType - Content type (e.g., 'approvalDecision', 'timesheetSubmission')
   * @param {Object} data - Note data
   * @param {Object} config - Configuration options
   * @returns {Promise<Object>} Note creation result
   */
  async createNote(noteType, contentType, data, config = {}) {
    try {
      logger.debug('Creating note', {
        noteType,
        contentType,
        dryRun: !!config.dryRun
      });

      // Get the content generator
      const contentGenerator = this.contentRegistry.getContentGenerator(noteType, contentType);

      // Validate data using the content generator's validation
      contentGenerator.validateData(data);

      // Generate note content
      const noteContent = contentGenerator.generateContent(data, config);

      if (config?.dryRun) {
        logger.info('Dry run note generation - skipping HubSpot create', {
          noteType,
          contentType,
          associationCount: noteContent.associations?.length || 0
        });

        return {
          success: true,
          dryRun: true,
          noteType,
          contentType,
          noteContent,
          message: `${noteType} ${contentType} note generated (dry run)`
        };
      }

      // Create the note in HubSpot
      const noteResult = await this._createNoteInHubSpot(noteContent);

      // Execute any post-creation actions
      if (contentGenerator.postCreationActions) {
        await contentGenerator.executePostCreationActions(data, noteResult, config);
      }

      return {
        success: true,
        noteId: noteResult.noteId,
        noteType,
        contentType,
        associations: noteContent.associations,
        message: `${noteType} ${contentType} note created successfully`
      };

    } catch (error) {
      logger.error(`Error creating ${noteType} ${contentType} note`, {
        error: error.message
      });
      logger.debug('Note creation error detail', {
        stack: error.stack
      });
      return {
        success: false,
        error: error.message,
        noteType,
        contentType,
        message: `Failed to create ${noteType} ${contentType} note`
      };
    }
  }

  /**
   * Create a sales deal note for timesheet approval decision
   * Convenience method for approval notes
   * 
   * @param {Object} data - Approval data
   * @param {string} decision - Approval decision (Approve/Reject)
   * @param {string} comments - Approval comments
   * @param {Object} config - Configuration options
   * @returns {Promise<Object>} Note creation result
   */
  async createApprovalNote(data, decision, comments, config = {}) {
    const noteData = {
      ...data,
      approvalStatus: decision,
      comment: comments
    };

    return this.createNote('approval', 'approvalDecision', noteData, config);
  }

  /**
   * Create note in HubSpot using the generated content
   * 
   * @param {Object} noteContent - Generated note content
   * @returns {Promise<Object>} Note creation result
   */
  async _createNoteInHubSpot(noteContent) {
    const noteData = {
      associations: noteContent.associations,
      properties: noteContent.properties
    };

    logger.debug('Posting note to HubSpot', {
      associationCount: noteContent.associations?.length || 0,
      propertyKeys: Object.keys(noteContent.properties || {})
    });

    const result = await this.hubspotService.createNote(noteData);

    logger.info('HubSpot note created', {
      noteId: result?.id || result?.properties?.hs_object_id
    });

    return {
      noteId: result?.id || result?.properties?.hs_object_id,
      metadata: result?.metadata
    };
  }

  /**
   * Get available note types
   * 
   * @returns {Array} Available note types
   */
  getAvailableNoteTypes() {
    return this.contentRegistry.getAvailableNoteTypes();
  }

  /**
   * Get available content types for a note type
   * 
   * @param {string} noteType - Note type
   * @returns {Array} Available content types
   */
  getAvailableContentTypes(noteType) {
    return this.contentRegistry.getAvailableContentTypes(noteType);
  }

  /**
   * Validate note creation data
   * 
   * @param {string} noteType - Note type
   * @param {string} contentType - Content type
   * @param {Object} data - Data to validate
   * @returns {Object} Validation result
   */
  validateNoteData(noteType, contentType, data) {
    try {
      const contentGenerator = this.contentRegistry.getContentGenerator(noteType, contentType);
      contentGenerator.validateData(data);
      return { valid: true };
    } catch (error) {
      return { valid: false, error: error.message };
    }
  }
}

module.exports = NoteCreationService;
