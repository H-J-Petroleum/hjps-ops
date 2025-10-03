#!/usr/bin/env node

/**
 * Test Production Approval Lookup
 * Test what approval objects exist in production HubSpot
 */

const axios = require('axios');

class ProductionApprovalLookup {
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

  async testApprovalLookup() {
    console.log('🔍 Testing Production Approval Lookup...\n');

    try {
      // Test 1: Search for approval objects
      await this.searchApprovalObjects();
      
      // Test 2: Try to get the specific approval by different ID formats
      await this.testSpecificApprovalIds();
      
    } catch (error) {
      console.error('❌ Production approval lookup failed:', error.message);
      throw error;
    }
  }

  async searchApprovalObjects() {
    console.log('📋 Step 1: Searching for approval objects...');
    
    try {
      const response = await this.client.get('/crm/v3/objects/2-26103010', {
        params: {
          limit: 10,
          properties: 'hs_object_id,approval_request_id,project_id,consultant_id'
        }
      });

      console.log('✅ Found approval objects:');
      console.log(`   Total: ${response.data.results.length}`);
      
      response.data.results.forEach((approval, index) => {
        console.log(`   ${index + 1}. ID: ${approval.id}`);
        console.log(`      Request ID: ${approval.properties.approval_request_id || 'N/A'}`);
        console.log(`      Project ID: ${approval.properties.project_id || 'N/A'}`);
        console.log(`      Consultant ID: ${approval.properties.consultant_id || 'N/A'}`);
        console.log('');
      });
      
    } catch (error) {
      console.error('❌ Failed to search approval objects:', error.response?.data || error.message);
      throw error;
    }
  }

  async testSpecificApprovalIds() {
    console.log('🎯 Step 2: Testing specific approval ID formats...');
    
    const testIds = [
      'hjp-68429-50156-114401-1759188306190', // From URL
      '68429-50156-114401-1759188306190',     // Without prefix
      '114401-1759188306190',                 // Just consultant + timestamp
      '1759188306190'                         // Just timestamp
    ];

    for (const testId of testIds) {
      try {
        console.log(`   Testing ID: ${testId}`);
        const response = await this.client.get(`/crm/v3/objects/2-26103010/${testId}`);
        console.log(`   ✅ Found approval with ID: ${testId}`);
        console.log(`      Properties:`, JSON.stringify(response.data.properties, null, 2));
        return;
      } catch (error) {
        if (error.response?.status === 404) {
          console.log(`   ❌ Not found: ${testId}`);
        } else {
          console.log(`   ⚠️  Error: ${error.response?.data?.message || error.message}`);
        }
      }
    }
  }
}

// Run the lookup
async function main() {
  try {
    const lookup = new ProductionApprovalLookup();
    await lookup.testApprovalLookup();
  } catch (error) {
    console.error('❌ Production approval lookup failed:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = ProductionApprovalLookup;
