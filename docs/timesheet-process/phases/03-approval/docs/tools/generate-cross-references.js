#!/usr/bin/env node

/**
 * Cross-Reference Generator for Timesheet Approval Process
 * 
 * This tool automatically generates cross-references between assets
 * by scanning asset files and extracting dependencies.
 */

const fs = require('fs');
const path = require('path');

class CrossReferenceGenerator {
  constructor(basePath) {
    this.basePath = basePath;
    this.assets = new Map();
    this.dependencies = new Map();
    this.crossReferences = new Map();
  }

  /**
   * Scan all asset files and extract dependencies
   */
  async scanAssets() {
    const assetTypes = ['workflows', 'forms', 'modules', 'landingpages', 'objects'];
    
    for (const assetType of assetTypes) {
      const assetPath = path.join(this.basePath, 'assets', assetType);
      if (fs.existsSync(assetPath)) {
        const files = fs.readdirSync(assetPath);
        for (const file of files) {
          if (file.endsWith('.md')) {
            await this.scanAssetFile(assetType, file);
          }
        }
      }
    }
  }

  /**
   * Scan individual asset file for dependencies
   */
  async scanAssetFile(assetType, filename) {
    const filePath = path.join(this.basePath, 'assets', assetType, filename);
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Extract asset ID from filename
    const assetId = this.extractAssetId(filename);
    if (!assetId) return;

    // Extract dependencies from content
    const deps = this.extractDependencies(content);
    
    this.assets.set(assetId, {
      type: assetType,
      filename,
      dependencies: deps
    });

    // Build dependency map
    for (const dep of deps) {
      if (!this.dependencies.has(dep)) {
        this.dependencies.set(dep, []);
      }
      this.dependencies.get(dep).push(assetId);
    }
  }

  /**
   * Extract asset ID from filename
   */
  extractAssetId(filename) {
    const match = filename.match(/^(\w+)-([a-f0-9-]+)-/);
    return match ? match[2] : null;
  }

  /**
   * Extract dependencies from markdown content
   */
  extractDependencies(content) {
    const deps = [];
    
    // Extract HubSpot IDs from content
    const hubspotIdRegex = /(\d{10,})/g;
    let match;
    while ((match = hubspotIdRegex.exec(content)) !== null) {
      deps.push(match[1]);
    }

    // Extract object references
    const objectRegex = /object-(\d+-\d+)/g;
    while ((match = objectRegex.exec(content)) !== null) {
      deps.push(match[1]);
    }

    // Extract form references
    const formRegex = /form-([a-f0-9-]+)/g;
    while ((match = formRegex.exec(content)) !== null) {
      deps.push(match[1]);
    }

    // Extract workflow references
    const workflowRegex = /workflow-(\d+)/g;
    while ((match = workflowRegex.exec(content)) !== null) {
      deps.push(match[1]);
    }

    return [...new Set(deps)]; // Remove duplicates
  }

  /**
   * Generate cross-reference data
   */
  generateCrossReferences() {
    for (const [assetId, asset] of this.assets) {
      const crossRef = {
        assetId,
        type: asset.type,
        filename: asset.filename,
        uses: asset.dependencies,
        usedBy: this.dependencies.get(assetId) || [],
        relationships: this.findRelationships(assetId)
      };
      
      this.crossReferences.set(assetId, crossRef);
    }
  }

  /**
   * Find relationships between assets
   */
  findRelationships(assetId) {
    const relationships = {
      triggers: [],
      triggeredBy: [],
      creates: [],
      createdBy: [],
      updates: [],
      updatedBy: [],
      reads: [],
      readBy: []
    };

    // This would be enhanced with more sophisticated relationship detection
    // based on asset types and content analysis
    
    return relationships;
  }

  /**
   * Generate cross-reference files
   */
  async generateFiles() {
    // Generate asset dependencies JSON
    const dependenciesData = Object.fromEntries(this.dependencies);
    fs.writeFileSync(
      path.join(this.basePath, 'cross-references', 'asset-dependencies.json'),
      JSON.stringify(dependenciesData, null, 2)
    );

    // Generate process flow JSON
    const processFlow = this.generateProcessFlow();
    fs.writeFileSync(
      path.join(this.basePath, 'cross-references', 'process-flow.json'),
      JSON.stringify(processFlow, null, 2)
    );

    // Generate object relationships JSON
    const objectRelationships = this.generateObjectRelationships();
    fs.writeFileSync(
      path.join(this.basePath, 'cross-references', 'object-relationships.json'),
      JSON.stringify(objectRelationships, null, 2)
    );

    // Generate cross-reference matrix markdown
    const matrixMarkdown = this.generateMatrixMarkdown();
    fs.writeFileSync(
      path.join(this.basePath, 'cross-references', 'cross-reference-matrix.md'),
      matrixMarkdown
    );
  }

  /**
   * Generate process flow data
   */
  generateProcessFlow() {
    // This would analyze the workflow sequence and generate flow data
    return {
      'timesheet-creation': {
        'next': 'request-for-approval'
      },
      'request-for-approval': {
        'previous': 'timesheet-creation',
        'next': 'approval-processing'
      },
      'approval-processing': {
        'previous': 'request-for-approval',
        'next': 'approval-interfaces'
      }
    };
  }

  /**
   * Generate object relationships
   */
  generateObjectRelationships() {
    // This would analyze object usage and generate relationship data
    return {
      '0-1': {
        'name': 'Contact',
        'usedBy': ['567500453', '5dd64adc'],
        'associations': ['2-118270518', '2-26173281']
      },
      '2-26103010': {
        'name': 'HJ Approvals',
        'createdBy': ['567500453'],
        'associations': ['0-1', '2-118270518']
      }
    };
  }

  /**
   * Generate cross-reference matrix markdown
   */
  generateMatrixMarkdown() {
    let markdown = '# Cross-Reference Matrix\n\n';
    markdown += '| Asset | Type | Uses | Used By |\n';
    markdown += '|-------|------|------|----------|\n';

    for (const [assetId, crossRef] of this.crossReferences) {
      markdown += `| ${assetId} | ${crossRef.type} | ${crossRef.uses.join(', ')} | ${crossRef.usedBy.join(', ')} |\n`;
    }

    return markdown;
  }

  /**
   * Main execution method
   */
  async run() {
    console.log('🔍 Scanning assets...');
    await this.scanAssets();
    
    console.log('🔗 Generating cross-references...');
    this.generateCrossReferences();
    
    console.log('📝 Generating files...');
    await this.generateFiles();
    
    console.log('✅ Cross-reference generation complete!');
    console.log(`📊 Processed ${this.assets.size} assets`);
    console.log(`🔗 Found ${this.dependencies.size} dependencies`);
  }
}

// Run the generator
if (require.main === module) {
  const basePath = path.join(__dirname, '..');
  const generator = new CrossReferenceGenerator(basePath);
  generator.run().catch(console.error);
}

module.exports = CrossReferenceGenerator;
