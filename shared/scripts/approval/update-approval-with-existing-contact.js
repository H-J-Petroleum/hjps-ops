#!/usr/bin/env node

/**
 * Update Approval with Existing Contact
 * Update the approval object to use the existing contact with mghood@hjpetro.com
 */

const axios = require('axios');

class ApprovalExistingContactUpdater {
  constructor() {
    this.sandboxToken = process.env.HUBSPOT_SANDBOX_ACCESS_TOKEN;

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

    this.objectIds = {
      approval: '2-50490319'
    };

    this.testObjects = {
      approvalId: '35681791773'
    };

    // Use the existing contact ID that has mghood@hjpetro.com
    this.existingContactId = '157878079560';
  }

  async updateApprovalWithExistingContact() {
    console.log('🔄 Updating Approval with Existing Contact...\n');

    try {
      const updateData = {
        properties: {
          approval_consultant_id: this.existingContactId,
          approval_consultant_email: 'mghood@hjpetro.com',
          approval_consultant_name: 'Matthew Hood'
        }
      };

      const response = await this.client.patch(
        `https://api.hubapi.com/crm/v3/objects/${this.objectIds.approval}/${this.testObjects.approvalId}`,
        updateData
      );

      console.log('✅ Approval updated with existing contact successfully');
      console.log(`   - Consultant ID: ${response.data.properties.approval_consultant_id}`);
      console.log(`   - Consultant Email: ${response.data.properties.approval_consultant_email}`);
      console.log(`   - Consultant Name: ${response.data.properties.approval_consultant_name}`);

    } catch (error) {
      console.error('❌ Failed to update approval:', error.response?.data?.message || error.message);
      throw error;
    }
  }
}

// Run the updater
async function main() {
  try {
    const updater = new ApprovalExistingContactUpdater();
    await updater.updateApprovalWithExistingContact();
  } catch (error) {
    console.error('❌ Approval update failed:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = ApprovalExistingContactUpdater;
