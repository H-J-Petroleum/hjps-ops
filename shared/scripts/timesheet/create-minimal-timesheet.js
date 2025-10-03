#!/usr/bin/env node

/**
 * Create Minimal Timesheet
 * Creates a timesheet with only the properties that exist in the sandbox
 */

const axios = require('axios');

class MinimalTimesheetCreator {
  constructor() {
    this.sandboxPortalId = '50518607';
    this.sandboxToken = process.env.HUBSPOT_SANDBOX_ACCESS_TOKEN;
    this.timesheetObjectId = '2-50490321';
    
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

  async createMinimalTimesheet() {
    console.log('📊 Creating Minimal Timesheet...\n');
    console.log(`📋 Sandbox Portal ID: ${this.sandboxPortalId}`);
    console.log(`📦 Timesheet Object ID: ${this.timesheetObjectId}`);
    console.log(`🔑 Using token: ${this.sandboxToken.substring(0, 10)}...`);
    console.log('');

    try {
      // Based on the error message, these are the properties that exist:
      // - timesheet_project_name (required)
      // - timesheet_approval_status (with valid options: None, Created, Submitted, Approved, Rejected, Reject-Updated, Re-Submitted, Processed)
      // - invoice_number_second_part
      // - bill_account
      // - bill_terms
      
      const timesheetData = {
        properties: {
          // Required property
          timesheet_project_name: 'Sandbox Test Project - Minimal',
          
          // Valid approval status
          timesheet_approval_status: 'Created',
          
          // Optional properties that exist
          invoice_number_second_part: '1001',
          bill_account: 'Test Account',
          bill_terms: 'Net 30'
        }
      };

      console.log('📝 Creating timesheet with minimal properties...');
      console.log('Properties:', JSON.stringify(timesheetData.properties, null, 2));

      const response = await this.client.post(`/crm/v3/objects/${this.timesheetObjectId}`, timesheetData);
      
      console.log('\n✅ Timesheet created successfully!');
      console.log(`   ID: ${response.data.id}`);
      console.log(`   Project: ${response.data.properties.timesheet_project_name}`);
      console.log(`   Status: ${response.data.properties.timesheet_approval_status}`);
      
      return response.data;

    } catch (error) {
      console.error('\n❌ Timesheet creation failed:', error.message);
      if (error.response?.data) {
        console.error('Response data:', JSON.stringify(error.response.data, null, 2));
      }
      throw error;
    }
  }
}

// Run the creator
if (require.main === module) {
  const creator = new MinimalTimesheetCreator();
  creator.createMinimalTimesheet().catch(console.error);
}

module.exports = MinimalTimesheetCreator;
