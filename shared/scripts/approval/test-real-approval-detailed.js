#!/usr/bin/env node

/**
 * Test Real Approval with Detailed Error Reporting
 * Test the real production approval URL with detailed error information
 */

const axios = require('axios');

class DetailedApprovalTester {
  constructor() {
    this.apiBaseUrl = 'http://localhost:3001';
    this.realApprovalUrl = 'https://hjpetro-1230608.hs-sites.com/hj-field-ticket-for-approval-step-01?project_id=hjp-68429-50156&approval_request_id=hjp-68429-50156-114401-1759188306190&customer_email=nsmith%40eltororesources.com&consultant_id=117923&approver_is=HJPetro&sales_deal_id=38777299476&utm_medium=email&_hsenc=p2ANqtz--d2BNtDxS_Pt52fg2cZ01FqUK8iOIMbs7nT0mC2v62MSBwszoR7z-kFjywcO4NOt_SZpi4ehq228XOyWxIqjTv4m8n-Q&_hsmi=299542408&utm_content=299542408&utm_source=hs_automation';
  }

  async testDetailed() {
    console.log('🎯 Testing Real Production Approval with Detailed Error Reporting...\n');

    try {
      // Test URL parsing first
      console.log('🔍 Step 1: URL Parsing...');
      const parseResponse = await this.testUrlParsing();
      
      // Test approval process with detailed error handling
      console.log('\n⚙️ Step 2: Approval Processing...');
      await this.testApprovalProcessWithDetails('Approve');
      
    } catch (error) {
      console.error('❌ Test failed:', error.message);
      if (error.response) {
        console.error('Response status:', error.response.status);
        console.error('Response data:', JSON.stringify(error.response.data, null, 2));
      }
    }
  }

  async testUrlParsing() {
    try {
      const response = await axios.post(`${this.apiBaseUrl}/api/approval/parse-url`, {
        approvalUrl: this.realApprovalUrl
      });

      console.log('✅ URL parsing successful');
      console.log('📋 Context:', JSON.stringify(response.data.data.context, null, 2));
      console.log('✅ Validation:', JSON.stringify(response.data.data.validation, null, 2));
      
      return response.data.data.context;
      
    } catch (error) {
      console.error('❌ URL parsing failed');
      if (error.response) {
        console.error('Status:', error.response.status);
        console.error('Data:', JSON.stringify(error.response.data, null, 2));
      }
      throw error;
    }
  }

  async testApprovalProcessWithDetails(decision) {
    try {
      console.log(`Processing ${decision} decision...`);
      
      const requestData = {
        approvalUrl: this.realApprovalUrl,
        decision: decision,
        comments: `Real approval test - ${decision} decision via API integration`,
        pdfType: 'customer'
      };

      console.log('📤 Request data:', JSON.stringify(requestData, null, 2));

      const response = await axios.post(`${this.apiBaseUrl}/api/approval/process`, requestData, {
        timeout: 60000, // 60 second timeout
        headers: {
          'Content-Type': 'application/json'
        }
      });

      console.log('✅ Approval processed successfully');
      console.log('📋 Response:', JSON.stringify(response.data, null, 2));
      
    } catch (error) {
      console.error(`❌ Approval ${decision} failed`);
      
      if (error.response) {
        console.error('Status Code:', error.response.status);
        console.error('Status Text:', error.response.statusText);
        console.error('Response Headers:', JSON.stringify(error.response.headers, null, 2));
        console.error('Response Data:', JSON.stringify(error.response.data, null, 2));
      } else if (error.request) {
        console.error('Request made but no response received');
        console.error('Request:', JSON.stringify(error.request, null, 2));
      } else {
        console.error('Error setting up request:', error.message);
      }
      
      throw error;
    }
  }
}

// Run the detailed tester
async function main() {
  try {
    const tester = new DetailedApprovalTester();
    await tester.testDetailed();
  } catch (error) {
    console.error('❌ Detailed test failed:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = DetailedApprovalTester;
