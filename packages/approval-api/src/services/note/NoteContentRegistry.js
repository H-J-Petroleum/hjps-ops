/**
 * Note Content Registry
 * Manages discovery and loading of note content generators
 * 
 * This registry automatically discovers note content generators and provides
 * a centralized way to access them by note type and content type.
 */

const fs = require('fs');
const path = require('path');

class NoteContentRegistry {
  constructor() {
    this.contentGenerators = new Map();
    this.noteTypes = new Set();
    this.contentTypes = new Map(); // noteType -> Set of contentTypes
    this.loadContentGenerators();
  }

  /**
   * Load all content generators from the note content directory
   */
  loadContentGenerators() {
    const contentDir = path.join(__dirname, 'content');

    if (!fs.existsSync(contentDir)) {
      console.warn('Note content directory does not exist:', contentDir);
      return;
    }

    // Load each note type directory
    const noteTypeDirs = fs.readdirSync(contentDir, { withFileTypes: true })
      .filter(dirent => dirent.isDirectory())
      .map(dirent => dirent.name);

    noteTypeDirs.forEach(noteType => {
      this.loadNoteTypeContent(noteType, path.join(contentDir, noteType));
    });
  }

  /**
   * Load content generators for a specific note type
   */
  loadNoteTypeContent(noteType, noteTypeDir) {
    this.noteTypes.add(noteType);
    this.contentTypes.set(noteType, new Set());

    // Load each content generator file
    const contentFiles = fs.readdirSync(noteTypeDir)
      .filter(file => file.endsWith('.js'))
      .map(file => file.replace('.js', ''));

    contentFiles.forEach(contentType => {
      try {
        const contentGeneratorPath = path.join(noteTypeDir, `${contentType}.js`);
        const ContentGenerator = require(contentGeneratorPath);

        // Validate the content generator has required methods
        this.validateContentGenerator(ContentGenerator, noteType, contentType);

        // Store the content generator
        const key = `${noteType}:${contentType}`;
        this.contentGenerators.set(key, ContentGenerator);
        this.contentTypes.get(noteType).add(contentType);

        console.log(`Loaded note content generator: ${noteType}:${contentType}`);
      } catch (error) {
        console.error(`Failed to load note content generator ${noteType}:${contentType}:`, error.message);
      }
    });
  }

  /**
   * Validate that a content generator has the required methods
   */
  validateContentGenerator(ContentGenerator, noteType, contentType) {
    const requiredMethods = ['validateData', 'generateContent'];
    const missingMethods = requiredMethods.filter(method =>
      typeof ContentGenerator[method] !== 'function'
    );

    if (missingMethods.length > 0) {
      throw new Error(
        `Content generator ${noteType}:${contentType} is missing required methods: ${missingMethods.join(', ')}`
      );
    }
  }

  /**
   * Get a content generator by note type and content type
   * 
   * @param {string} noteType - Note type (e.g., 'approval', 'timesheet')
   * @param {string} contentType - Content type (e.g., 'approvalDecision', 'timesheetSubmission')
   * @returns {Object} Content generator
   */
  getContentGenerator(noteType, contentType) {
    const key = `${noteType}:${contentType}`;
    const contentGenerator = this.contentGenerators.get(key);

    if (!contentGenerator) {
      const availableTypes = Array.from(this.noteTypes)
        .map(type => `${type}: [${Array.from(this.contentTypes.get(type) || []).join(', ')}]`)
        .join(', ');

      throw new Error(
        `Content generator not found: ${noteType}:${contentType}. Available types: ${availableTypes}`
      );
    }

    return contentGenerator;
  }

  /**
   * Get all available note types
   * 
   * @returns {Array} Available note types
   */
  getAvailableNoteTypes() {
    return Array.from(this.noteTypes).sort();
  }

  /**
   * Get all available content types for a note type
   * 
   * @param {string} noteType - Note type
   * @returns {Array} Available content types
   */
  getAvailableContentTypes(noteType) {
    const contentTypes = this.contentTypes.get(noteType);
    return contentTypes ? Array.from(contentTypes).sort() : [];
  }

  /**
   * Get all loaded content generators
   * 
   * @returns {Map} All content generators
   */
  getAllContentGenerators() {
    return new Map(this.contentGenerators);
  }

  /**
   * Reload all content generators
   * Useful for development or when content generators are added dynamically
   */
  reloadContentGenerators() {
    this.contentGenerators.clear();
    this.noteTypes.clear();
    this.contentTypes.clear();
    this.loadContentGenerators();
  }
}

module.exports = NoteContentRegistry;
