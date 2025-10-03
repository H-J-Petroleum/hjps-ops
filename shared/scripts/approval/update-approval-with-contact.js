#!/usr/bin/env node

/**
 * Update Approval with Contact
 * Update the approval object to use the new contact ID
 */

const axios = require('axios');
const fs = require('fs');

class ApprovalContactUpdater {
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

    // Load contact info
    try {
      const contactInfo = JSON.parse(fs.readFileSync('test-contact-info.json', 'utf8'));
      this.contactId = contactInfo.contactId;
      this.contactEmail = contactInfo.email;
      console.log(`📁 Using contact: ${contactInfo.name} (${contactInfo.contactId})`);
    } catch (error) {
      console.log('⚠️ No contact info found, using default');
      this.contactId = '159638156848';
      this.contactEmail = 'mghood+test1759202138094@hjpetro.com';
    }
  }

  async updateApprovalWithContact() {
    console.log('🔄 Updating Approval with Contact...\n');

    try {
      const updateData = {
        properties: {
          approval_consultant_id: this.contactId,
          approval_consultant_email: this.contactEmail,
          approval_consultant_name: 'Matthew Hood'
        }
      };

      const response = await this.client.patch(
        `https://api.hubapi.com/crm/v3/objects/${this.objectIds.approval}/${this.testObjects.approvalId}`,
        updateData
      );

      console.log('✅ Approval updated with contact successfully');
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
    const updater = new ApprovalContactUpdater();
    await updater.updateApprovalWithContact();
  } catch (error) {
    console.error('❌ Approval update failed:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = ApprovalContactUpdater;
