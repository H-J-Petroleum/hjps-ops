#!/usr/bin/env node

/**
 * Create Minimal Approval
 * Creates an approval with only the properties that exist in the sandbox
 */

const axios = require('axios');

class MinimalApprovalCreator {
  constructor() {
    this.sandboxPortalId = '50518607';
    this.sandboxToken = process.env.HUBSPOT_SANDBOX_ACCESS_TOKEN;
    this.approvalObjectId = '2-50490319';

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

  async createMinimalApproval() {
    console.log('📋 Creating Minimal Approval...\n');
    console.log(`📋 Sandbox Portal ID: ${this.sandboxPortalId}`);
    console.log(`📦 Approval Object ID: ${this.approvalObjectId}`);
    console.log(`🔑 Using token: ${this.sandboxToken.substring(0, 10)}...`);
    console.log('');

    try {
      // Based on the real approval data we saw earlier, these properties exist:
      const approvalData = {
        properties: {
          // Basic approval info
          approval_approval_status: 'Submitted',
          approval_approve_reject: null, // Will be set when approved

          // Consultant info
          approval_consultant_name: 'Test Consultant',

          // Customer info
          approval_customer: 'Test Customer Corp',

          // Project info
          project_name: 'Sandbox Test Project - Minimal',
          approval_project_id: `hjp-test-${Date.now()}`,
          approval_request_id: `hjp-test-${Date.now()}-test-${Date.now()}`,

          // Timesheet references (we'll use the timesheet we just created)
          response_approval_timesheet_ids_array: '35693058397', // The timesheet ID from our minimal creation

          // Approver info (will be set when approved)
          approver_is: null // Will be set to 'HJPetro' when approved
        }
      };

      console.log('📝 Creating approval with minimal properties...');
      console.log('Properties:', JSON.stringify(approvalData.properties, null, 2));

      const response = await this.client.post(`/crm/v3/objects/${this.approvalObjectId}`, approvalData);

      console.log('\n✅ Approval created successfully!');
      console.log(`   ID: ${response.data.id}`);
      console.log(`   Consultant: ${response.data.properties.approval_consultant_name}`);
      console.log(`   Status: ${response.data.properties.approval_approval_status}`);
      console.log(`   Timesheets: ${response.data.properties.response_approval_timesheet_ids_array}`);

      return response.data;

    } catch (error) {
      console.error('\n❌ Approval creation failed:', error.message);
      if (error.response?.data) {
        console.error('Response data:', JSON.stringify(error.response.data, null, 2));
      }
      throw error;
    }
  }
}

// Run the creator
if (require.main === module) {
  const creator = new MinimalApprovalCreator();
  creator.createMinimalApproval().catch(console.error);
}

module.exports = MinimalApprovalCreator;
