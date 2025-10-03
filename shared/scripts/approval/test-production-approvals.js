#!/usr/bin/env node

/**
 * Test Production Approvals
 * Check what approval objects exist in the real production portal
 */

const axios = require('axios');

class ProductionApprovalTester {
  constructor() {
    this.baseURL = 'https://api.hubapi.com';
    this.apiKey = process.env.HUBSPOT_PRIVATE_APP_TOKEN;

    if (!this.apiKey) {
      throw new Error('HUBSPOT_PRIVATE_APP_TOKEN environment variable is required');
    }

    this.client = axios.create({
      baseURL: this.baseURL,
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      }
    });
  }

  async testProductionApprovals() {
    console.log('🔍 Testing Production Approvals...\n');

    try {
      // Get approval objects
      await this.getApprovalObjects();

      // Test the specific approval ID from the URL
      await this.testSpecificApprovalId();

    } catch (error) {
      console.error('❌ Production approval test failed:', error.message);
      throw error;
    }
  }

  async getApprovalObjects() {
    console.log('📋 Step 1: Getting approval objects from production...');

    try {
      const response = await this.client.get('/crm/v3/objects/2-50490319', {
        params: {
          limit: 10,
          properties: 'hs_object_id,approval_request_id,project_id,consultant_id,approval_status'
        }
      });

      console.log('✅ Found approval objects:');
      console.log(`   Total: ${response.data.results.length}`);

      response.data.results.forEach((approval, index) => {
        console.log(`   ${index + 1}. ID: ${approval.id}`);
        console.log(`      Request ID: ${approval.properties.approval_request_id || 'N/A'}`);
        console.log(`      Project ID: ${approval.properties.project_id || 'N/A'}`);
        console.log(`      Consultant ID: ${approval.properties.consultant_id || 'N/A'}`);
        console.log(`      Status: ${approval.properties.approval_status || 'N/A'}`);
        console.log('');
      });

    } catch (error) {
      console.error('❌ Failed to get approval objects:', error.response?.data || error.message);
      throw error;
    }
  }

  async testSpecificApprovalId() {
    console.log('🎯 Step 2: Testing specific approval ID from URL...');

    const urlApprovalId = 'hjp-68429-50156-114401-1759188306190';
    console.log(`   Testing ID: ${urlApprovalId}`);

    try {
      const response = await this.client.get(`/crm/v3/objects/2-50490319/${urlApprovalId}`);
      console.log(`   ✅ Found approval with ID: ${urlApprovalId}`);
      console.log(`   Properties:`, JSON.stringify(response.data.properties, null, 2));
    } catch (error) {
      if (error.response?.status === 404) {
        console.log(`   ❌ Approval not found: ${urlApprovalId}`);
        console.log(`   This means the approval object doesn't exist in production yet.`);
        console.log(`   The URL might be from a different environment or the approval was deleted.`);
      } else {
        console.log(`   ⚠️  Error: ${error.response?.data?.message || error.message}`);
      }
    }
  }
}

// Run the tester
async function main() {
  try {
    const tester = new ProductionApprovalTester();
    await tester.testProductionApprovals();
  } catch (error) {
    console.error('❌ Production approval test failed:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = ProductionApprovalTester;
