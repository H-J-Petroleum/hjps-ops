#!/usr/bin/env node

/**
 * Test Approval Properties
 * Test if the approval-specific properties exist in the sandbox
 */

const axios = require('axios');

class ApprovalPropertyTester {
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
      timesheet: '2-50490321',
      approval: '2-50490319'
    };
  }

  async testApprovalProperties() {
    console.log('🧪 Testing Approval Properties in Sandbox...\n');

    try {
      // Use the objects we know exist
      const timesheetId = '35639804249';
      const approvalId = '35681791773';

      // Test 1: Check what properties exist on timesheet
      await this.checkTimesheetProperties(timesheetId);

      // Test 2: Check what properties exist on approval
      await this.checkApprovalProperties(approvalId);

      // Test 3: Try updating with approval-specific properties
      await this.testApprovalSpecificUpdates(timesheetId, approvalId);

    } catch (error) {
      console.error('❌ Test failed:', error.message);
      if (error.response) {
        console.error('Response status:', error.response.status);
        console.error('Response data:', error.response.data);
      }
      throw error;
    }
  }

  async checkTimesheetProperties(timesheetId) {
    console.log('📋 Checking Timesheet Properties...');

    try {
      const response = await this.client.get(
        `https://api.hubapi.com/crm/v3/objects/${this.objectIds.timesheet}/${timesheetId}`
      );

      console.log('✅ Timesheet retrieved successfully');
      console.log('Available properties:', Object.keys(response.data.properties));

      // Check for approval-specific properties
      const approvalProps = [
        'timesheet_approval_status',
        'processed_date',
        'timesheet_approval_comment'
      ];

      console.log('\nApproval-specific properties:');
      approvalProps.forEach(prop => {
        const exists = response.data.properties.hasOwnProperty(prop);
        console.log(`  ${prop}: ${exists ? '✅ EXISTS' : '❌ MISSING'}`);
      });

    } catch (error) {
      console.error('❌ Failed to check timesheet properties:', error.response?.data || error.message);
    }
  }

  async checkApprovalProperties(approvalId) {
    console.log('\n✅ Checking Approval Properties...');

    try {
      const response = await this.client.get(
        `https://api.hubapi.com/crm/v3/objects/${this.objectIds.approval}/${approvalId}`
      );

      console.log('✅ Approval retrieved successfully');
      console.log('Available properties:', Object.keys(response.data.properties));

      // Check for approval-specific properties
      const approvalProps = [
        'approval_approve_reject',
        'approval_approval_status',
        'approval_processed_date',
        'response_approval_customer_comment'
      ];

      console.log('\nApproval-specific properties:');
      approvalProps.forEach(prop => {
        const exists = response.data.properties.hasOwnProperty(prop);
        console.log(`  ${prop}: ${exists ? '✅ EXISTS' : '❌ MISSING'}`);
      });

    } catch (error) {
      console.error('❌ Failed to check approval properties:', error.response?.data || error.message);
    }
  }

  async testApprovalSpecificUpdates(timesheetId, approvalId) {
    console.log('\n🔄 Testing Approval-Specific Updates...');

    try {
      // Test timesheet update with approval properties
      console.log('Testing timesheet update...');
      const timesheetUpdate = {
        properties: {
          timesheet_approval_status: 'Approved',
          processed_date: new Date().toISOString(),
          timesheet_approval_comment: 'Test approval comment'
        }
      };

      try {
        const timesheetResponse = await this.client.patch(
          `https://api.hubapi.com/crm/v3/objects/${this.objectIds.timesheet}/${timesheetId}`,
          timesheetUpdate
        );
        console.log('✅ Timesheet update successful');
      } catch (error) {
        console.log('❌ Timesheet update failed:', error.response?.data?.message || error.message);
      }

      // Test approval update with approval properties
      console.log('\nTesting approval update...');
      const approvalUpdate = {
        properties: {
          approval_approve_reject: 'Approve',
          approval_approval_status: 'Approved',
          approval_processed_date: new Date().toISOString(),
          response_approval_customer_comment: 'Test approval comment'
        }
      };

      try {
        const approvalResponse = await this.client.patch(
          `https://api.hubapi.com/crm/v3/objects/${this.objectIds.approval}/${approvalId}`,
          approvalUpdate
        );
        console.log('✅ Approval update successful');
      } catch (error) {
        console.log('❌ Approval update failed:', error.response?.data?.message || error.message);
      }

    } catch (error) {
      console.error('❌ Failed to test approval-specific updates:', error.message);
    }
  }
}

// Run the test
async function main() {
  try {
    const tester = new ApprovalPropertyTester();
    await tester.testApprovalProperties();
  } catch (error) {
    console.error('❌ Test suite failed:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = ApprovalPropertyTester;
