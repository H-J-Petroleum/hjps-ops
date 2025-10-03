#!/usr/bin/env node

/**
 * Investigate Timesheet Schema
 * Checks the HJ Timesheets object schema to find required properties
 */

const axios = require('axios');

class TimesheetSchemaInvestigator {
  constructor() {
    this.sandboxPortalId = '50518607';
    this.sandboxToken = process.env.HUBSPOT_SANDBOX_ACCESS_TOKEN;
    this.timesheetObjectId = '2-50490321'; // HJ Timesheets
    
    if (!this.sandboxToken) {
      throw new Error('HUBSPOT_SANDBOX_ACCESS_TOKEN environment variable is required');
    }

    this.client = axios.create({
      baseURL: 'https://api.hubapi.com',
      headers: {
        'Authorization': `Bearer ${this.sandboxToken}`,
        'Content-Type': 'application/json'
      }
    });
  }

  async investigateSchema() {
    console.log('🔍 Investigating HJ Timesheets Schema...\n');
    console.log(`📋 Sandbox Portal ID: ${this.sandboxPortalId}`);
    console.log(`📦 Timesheet Object ID: ${this.timesheetObjectId}`);
    console.log(`🔑 Using token: ${this.sandboxToken.substring(0, 10)}...`);
    console.log('');

    try {
      // Get the object schema
      console.log('📋 Getting object schema...');
      const schemaResponse = await this.client.get(`/crm/v3/schemas/${this.timesheetObjectId}`);
      const schema = schemaResponse.data;
      
      console.log(`✅ Schema retrieved (${schemaResponse.status})`);
      console.log(`   Object Name: ${schema.name}`);
      console.log(`   Object Label: ${schema.labels?.singular || 'N/A'}`);
      console.log(`   Properties Count: ${schema.properties?.length || 0}`);
      console.log('');

      // Analyze properties
      this.analyzeProperties(schema.properties || []);
      
      // Get sample timesheet if any exist
      await this.getSampleTimesheet();

    } catch (error) {
      console.error('\n❌ Schema investigation failed:', error.message);
      if (error.response?.data) {
        console.error('Response data:', JSON.stringify(error.response.data, null, 2));
      }
      throw error;
    }
  }

  analyzeProperties(properties) {
    console.log('📊 Property Analysis:');
    console.log('====================');
    
    const requiredProperties = [];
    const optionalProperties = [];
    const systemProperties = [];
    
    properties.forEach(prop => {
      const isRequired = prop.required || false;
      const isSystem = prop.name?.startsWith('hs_') || prop.name?.startsWith('created') || prop.name?.startsWith('updated');
      
      const propertyInfo = {
        name: prop.name,
        label: prop.label,
        type: prop.type,
        required: isRequired,
        description: prop.description || 'No description'
      };
      
      if (isSystem) {
        systemProperties.push(propertyInfo);
      } else if (isRequired) {
        requiredProperties.push(propertyInfo);
      } else {
        optionalProperties.push(propertyInfo);
      }
    });
    
    console.log(`\n🔴 Required Properties (${requiredProperties.length}):`);
    requiredProperties.forEach((prop, index) => {
      console.log(`   ${index + 1}. ${prop.name} (${prop.type})`);
      console.log(`      Label: ${prop.label}`);
      console.log(`      Description: ${prop.description}`);
    });
    
    console.log(`\n🟡 Optional Properties (${optionalProperties.length}):`);
    optionalProperties.slice(0, 10).forEach((prop, index) => { // Show first 10
      console.log(`   ${index + 1}. ${prop.name} (${prop.type})`);
      console.log(`      Label: ${prop.label}`);
    });
    
    if (optionalProperties.length > 10) {
      console.log(`   ... and ${optionalProperties.length - 10} more optional properties`);
    }
    
    console.log(`\n🔵 System Properties (${systemProperties.length}):`);
    systemProperties.slice(0, 5).forEach((prop, index) => { // Show first 5
      console.log(`   ${index + 1}. ${prop.name} (${prop.type})`);
    });
    
    if (systemProperties.length > 5) {
      console.log(`   ... and ${systemProperties.length - 5} more system properties`);
    }
    
    // Generate sample creation data
    this.generateSampleData(requiredProperties);
  }

  generateSampleData(requiredProperties) {
    console.log('\n📝 Sample Creation Data:');
    console.log('========================');
    
    const sampleData = {
      properties: {}
    };
    
    requiredProperties.forEach(prop => {
      let sampleValue;
      
      switch (prop.type) {
        case 'string':
          sampleValue = `Sample ${prop.label}`;
          break;
        case 'number':
          sampleValue = 100;
          break;
        case 'datetime':
          sampleValue = new Date().toISOString();
          break;
        case 'bool':
          sampleValue = true;
          break;
        case 'enumeration':
          sampleValue = 'pending'; // Common default
          break;
        default:
          sampleValue = `Sample ${prop.type}`;
      }
      
      sampleData.properties[prop.name] = sampleValue;
    });
    
    console.log('```json');
    console.log(JSON.stringify(sampleData, null, 2));
    console.log('```');
  }

  async getSampleTimesheet() {
    console.log('\n📄 Getting Sample Timesheet...');
    
    try {
      const response = await this.client.get(`/crm/v3/objects/${this.timesheetObjectId}`, {
        params: { limit: 1 }
      });
      
      if (response.data.results?.length > 0) {
        const timesheet = response.data.results[0];
        console.log(`✅ Found sample timesheet: ${timesheet.id}`);
        console.log('\n📋 Sample Timesheet Properties:');
        
        Object.entries(timesheet.properties).forEach(([key, value]) => {
          console.log(`   ${key}: ${value}`);
        });
      } else {
        console.log('ℹ️ No existing timesheets found');
      }
      
    } catch (error) {
      console.log(`⚠️ Could not retrieve sample timesheet: ${error.message}`);
    }
  }
}

// Run the investigation
if (require.main === module) {
  const investigator = new TimesheetSchemaInvestigator();
  investigator.investigateSchema().catch(console.error);
}

module.exports = TimesheetSchemaInvestigator;
