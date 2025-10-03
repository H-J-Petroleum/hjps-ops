#!/usr/bin/env node

/**
 * Simple Approval Test
 * Test the approval workflow with minimal property updates
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');

class SimpleApprovalTest {
  constructor() {
    this.sandboxPortalId = '50518607';
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
      timesheet: '2-50490321',
      approval: '2-50490319'
    };

    this.testResults = [];
  }

  async runTest() {
    console.log('🧪 Simple Approval Test...\n');

    try {
      // Load test data
      await this.loadTestData();
      
      // Test timesheet update with minimal properties
      await this.testTimesheetUpdate();
      
      // Test approval update with minimal properties
      await this.testApprovalUpdate();
      
      // Test complete workflow
      await this.testCompleteWorkflow();
      
      this.printResults();
      
    } catch (error) {
      console.error('❌ Test failed:', error.message);
      if (error.response) {
        console.error('Response status:', error.response.status);
        console.error('Response data:', error.response.data);
      }
      throw error;
    }
  }

  async loadTestData() {
    console.log('📝 Loading test data...');
    
    // Look for the most recent test data file
    const testDataFiles = this.findTestDataFiles();
    
    if (testDataFiles.length === 0) {
      throw new Error('No seeded test data found. Please run the seeder first.');
    }

    // Load the most recent test data
    const latestFile = testDataFiles[0];
    const testData = JSON.parse(fs.readFileSync(latestFile, 'utf8'));
    
    this.testData = testData.data;
    console.log(`✅ Loaded test data from: ${latestFile}`);
    console.log(`   - Timesheet: ${this.testData.timesheet.id}`);
    console.log(`   - Approval: ${this.testData.approval.id}`);
  }

  async testTimesheetUpdate() {
    console.log('\n📋 Testing Timesheet Update...');
    
    try {
      // Try updating with just basic properties that should exist
      const updateData = {
        properties: {
          '0': 'Updated Test Project', // Basic string property
          '1': 'Updated Customer',     // Basic string property
          '2': 'Updated Operator'      // Basic string property
        }
      };

      const response = await this.client.patch(
        `https://api.hubapi.com/crm/v3/objects/${this.objectIds.timesheet}/${this.testData.timesheet.id}`,
        updateData
      );

      console.log('✅ Timesheet update successful');
      this.recordTest('Timesheet Update', true, 'Successfully updated timesheet with basic properties');
      
    } catch (error) {
      console.log('❌ Timesheet update failed:', error.response?.data?.message || error.message);
      this.recordTest('Timesheet Update', false, error.response?.data?.message || error.message);
    }
  }

  async testApprovalUpdate() {
    console.log('\n✅ Testing Approval Update...');
    
    try {
      // Try updating with just basic properties that should exist
      const updateData = {
        properties: {
          '0': 'Updated Approval Status', // Basic string property
          '1': 'Approved',                // Basic enumeration property
          '2': 'Updated Project Name'     // Basic string property
        }
      };

      const response = await this.client.patch(
        `https://api.hubapi.com/crm/v3/objects/${this.objectIds.approval}/${this.testData.approval.id}`,
        updateData
      );

      console.log('✅ Approval update successful');
      this.recordTest('Approval Update', true, 'Successfully updated approval with basic properties');
      
    } catch (error) {
      console.log('❌ Approval update failed:', error.response?.data?.message || error.message);
      this.recordTest('Approval Update', false, error.response?.data?.message || error.message);
    }
  }

  async testCompleteWorkflow() {
    console.log('\n🔄 Testing Complete Workflow...');
    
    try {
      // Test the approval service with mock PDF generation
      const ApprovalService = require('../src/approval-api/src/services/approvalService');
      
      const approvalService = new ApprovalService({
        sandbox: {
          portalId: this.sandboxPortalId,
          accessToken: this.sandboxToken,
          objectTypes: {
            approval: this.objectIds.approval,
            timesheet: this.objectIds.timesheet
          }
        }
      });

      const result = await approvalService.processApproval({
        approvalId: this.testData.approval.id,
        decision: 'Approve',
        comments: 'Test approval via simple test',
        pdfType: 'customer',
        manualContext: {
          approvalTimesheetIds: [this.testData.timesheet.id]
        }
      });

      if (result.success) {
        console.log('✅ Complete workflow successful');
        this.recordTest('Complete Workflow', true, 'Workflow completed successfully');
      } else {
        console.log('❌ Complete workflow failed:', result.error);
        this.recordTest('Complete Workflow', false, result.error);
      }
      
    } catch (error) {
      console.log('❌ Complete workflow failed:', error.message);
      this.recordTest('Complete Workflow', false, error.message);
    }
  }

  findTestDataFiles() {
    const logsDir = path.join(process.cwd(), 'logs');
    if (!fs.existsSync(logsDir)) {
      return [];
    }

    return fs.readdirSync(logsDir)
      .filter(file => file.startsWith('sandbox-test-data-') && file.endsWith('.json'))
      .map(file => path.join(logsDir, file))
      .sort((a, b) => fs.statSync(b).mtime - fs.statSync(a).mtime);
  }

  recordTest(testName, success, message) {
    this.testResults.push({
      test: testName,
      success,
      message,
      timestamp: new Date().toISOString()
    });
  }

  printResults() {
    console.log('\n📊 Test Results:');
    console.log('================');
    
    this.testResults.forEach(result => {
      const status = result.success ? '✅' : '❌';
      console.log(`${status} ${result.test}: ${result.message}`);
    });
    
    const successCount = this.testResults.filter(r => r.success).length;
    const totalCount = this.testResults.length;
    
    console.log(`\n📈 Summary: ${successCount}/${totalCount} tests passed`);
    
    if (successCount === totalCount) {
      console.log('🎉 All tests passed!');
    } else {
      console.log('⚠️ Some tests failed. Check the logs for details.');
    }
  }
}

// Run the test
async function main() {
  try {
    const test = new SimpleApprovalTest();
    await test.runTest();
  } catch (error) {
    console.error('❌ Test suite failed:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = SimpleApprovalTest;
