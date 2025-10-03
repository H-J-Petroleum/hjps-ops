#!/usr/bin/env node

/**
 * Sandbox Approval Test Script
 * Tests the complete approval workflow using Sandbox 50518607
 */

const path = require('path');
const fs = require('fs');

// Add the src directory to the module path
const srcPath = path.join(__dirname, '..', 'src', 'approval-api', 'src');
require('module').globalPaths.push(srcPath);

const ApprovalService = require('../src/approval-api/src/services/approvalService');
const HubspotService = require('../src/approval-api/src/services/hubspotService');
const logger = require('../src/approval-api/src/utils/logger');

class SandboxApprovalTest {
  constructor() {
    this.sandboxPortalId = '50518607';
    this.hubspotService = new HubspotService();
    this.approvalService = new ApprovalService();
    this.testResults = {
      passed: 0,
      failed: 0,
      tests: []
    };
  }

  /**
   * Run all sandbox tests
   */
  async runTests() {
    console.log('🧪 Starting Sandbox Approval Tests...\n');
    console.log(`📋 Sandbox Portal ID: ${this.sandboxPortalId}\n`);

    try {
      // Test 1: Verify sandbox connection
      await this.testSandboxConnection();

      // Test 2: Create test data
      await this.createTestData();

      // Test 3: Test approval workflow
      await this.testApprovalWorkflow();

      // Test 4: Test PDF generation
      await this.testPdfGeneration();

      // Test 5: Test email notifications
      await this.testEmailNotifications();

      // Test 6: Verify data updates
      await this.verifyDataUpdates();

      // Test 7: Cleanup test data
      await this.cleanupTestData();

      this.printTestResults();

    } catch (error) {
      console.error('❌ Test suite failed:', error.message);
      process.exit(1);
    }
  }

  /**
   * Test 1: Verify sandbox connection
   */
  async testSandboxConnection() {
    console.log('🔌 Test 1: Verifying Sandbox Connection...');

    try {
      // Test connection by trying to get our test approval object
      const approval = await this.hubspotService.getApprovalObject('35674383001');

      if (approval && approval.id) {
        this.recordTest('Sandbox Connection', true, 'Successfully connected to sandbox and retrieved test approval');
        console.log('✅ Sandbox connection verified');
        console.log(`   - Retrieved approval: ${approval.id}`);
        console.log(`   - Status: ${approval.properties.approval_approval_status}`);
      } else {
        throw new Error('Could not retrieve test approval object');
      }
    } catch (error) {
      this.recordTest('Sandbox Connection', false, error.message);
      console.log('❌ Sandbox connection failed:', error.message);
      throw error;
    }
  }

  /**
   * Test 2: Load seeded test data
   */
  async createTestData() {
    console.log('\n📝 Test 2: Loading Seeded Test Data...');
    
    try {
      // Look for the most recent test data file
      const testDataFiles = this.findTestDataFiles();
      
      if (testDataFiles.length === 0) {
        console.log('⚠️ No seeded test data found. Please run the seeder first:');
        console.log('   node scripts/seed-complete-test-data.js');
        throw new Error('No seeded test data available');
      }

      // Load the most recent test data
      const latestFile = testDataFiles[0];
      const testData = JSON.parse(fs.readFileSync(latestFile, 'utf8'));
      
      console.log(`✅ Loaded test data from: ${latestFile}`);
      console.log(`   - Contact: ${testData.data.contact.id}`);
      console.log(`   - Timesheet: ${testData.data.timesheet.id}`);
      console.log(`   - Approval: ${testData.data.approval.id}`);
      console.log(`   - Deal: ${testData.data.deal.id}`);

      this.testData = {
        contacts: [testData.data.contact],
        timesheets: [testData.data.timesheet],
        approvals: [testData.data.approval],
        deals: [testData.data.deal]
      };

      this.recordTest('Test Data Loading', true, 'Successfully loaded seeded test data');
    } catch (error) {
      this.recordTest('Test Data Loading', false, error.message);
      console.log('❌ Test data loading failed:', error.message);
      throw error;
    }
  }

  /**
   * Find test data files
   */
  findTestDataFiles() {
    const fs = require('fs');
    const path = require('path');

    if (!fs.existsSync('logs')) {
      return [];
    }

    const files = fs.readdirSync('logs')
      .filter(file => file.startsWith('sandbox-test-data-') && file.endsWith('.json'))
      .map(file => path.join('logs', file))
      .sort((a, b) => {
        const statA = fs.statSync(a);
        const statB = fs.statSync(b);
        return statB.mtime - statA.mtime; // Most recent first
      });

    return files;
  }

  /**
   * Test 3: Test approval workflow
   */
  async testApprovalWorkflow() {
    console.log('\n⚙️ Test 3: Testing Approval Workflow...');

    try {
      const approval = this.testData.approvals[0];
      const timesheets = this.testData.timesheets;

      console.log(`   - Testing approval: ${approval.id}`);
      console.log(`   - Processing ${timesheets.length} timesheets`);
      console.log(`   - Period: ${approval.properties.response_approval_from_date} to ${approval.properties.response_approval_until_date}`);

      const result = await this.approvalService.processApproval({
        approvalId: approval.id,
        decision: 'Approve',
        comments: 'Test approval via sandbox API with multiple timesheets',
        pdfType: 'customer',
        manualContext: {
          approvalTimesheetIds: [timesheets[0].id] // Pass timesheet ID directly
        }
      });

      if (result.success) {
        this.recordTest('Approval Workflow', true, `Approval workflow completed successfully for ${timesheets.length} timesheets`);
        console.log('✅ Approval workflow completed');
        this.approvalResult = result;
      } else {
        throw new Error('Approval workflow failed');
      }
    } catch (error) {
      this.recordTest('Approval Workflow', false, error.message);
      console.log('❌ Approval workflow failed:', error.message);
      throw error;
    }
  }

  /**
   * Test 4: Test PDF generation
   */
  async testPdfGeneration() {
    console.log('\n📄 Test 4: Testing PDF Generation...');

    try {
      const pdfResult = await this.approvalService.generateWF26FieldTickets(
        this.testData.approval.id,
        { generateCustomer: true, generateConsultant: true }
      );

      if (pdfResult.success) {
        this.recordTest('PDF Generation', true, 'PDFs generated successfully');
        console.log('✅ PDF generation completed');
        console.log(`   - Customer PDF: ${pdfResult.results.customer?.fileId || 'N/A'}`);
        console.log(`   - Consultant PDF: ${pdfResult.results.consultant?.fileId || 'N/A'}`);
      } else {
        throw new Error('PDF generation failed');
      }
    } catch (error) {
      this.recordTest('PDF Generation', false, error.message);
      console.log('❌ PDF generation failed:', error.message);
      throw error;
    }
  }

  /**
   * Test 5: Test email notifications
   */
  async testEmailNotifications() {
    console.log('\n📧 Test 5: Testing Email Notifications...');

    try {
      const emailResult = await this.approvalService.sendApprovalNotifications(
        {
          approvalRequestId: this.testData.approval.id,
          projectId: this.testData.approval.projectId,
          consultantId: this.testData.contact.id,
          approverType: 'HJPetro',
          approverEmail: 'test@hjpetro.com'
        },
        {
          decision: 'Approve',
          comments: 'Test approval via sandbox API',
          pdfResult: this.approvalResult?.pdfResult
        }
      );

      if (emailResult.success) {
        this.recordTest('Email Notifications', true, 'Emails sent successfully');
        console.log('✅ Email notifications sent');
      } else {
        throw new Error('Email notifications failed');
      }
    } catch (error) {
      this.recordTest('Email Notifications', false, error.message);
      console.log('❌ Email notifications failed:', error.message);
      // Don't throw - emails might fail in sandbox
    }
  }

  /**
   * Test 6: Verify data updates
   */
  async verifyDataUpdates() {
    console.log('\n🔍 Test 6: Verifying Data Updates...');

    try {
      // Verify timesheet status update
      const timesheet = await this.hubspotService.getTimesheet(this.testData.timesheet.id);
      if (timesheet.properties.timesheet_approval_status === 'Approved') {
        console.log('✅ Timesheet status updated to Approved');
      } else {
        throw new Error('Timesheet status not updated correctly');
      }

      // Verify approval status update
      const approval = await this.hubspotService.getApproval(this.testData.approval.id);
      if (approval.properties.approval_approval_status === 'Approved') {
        console.log('✅ Approval status updated to Approved');
      } else {
        throw new Error('Approval status not updated correctly');
      }

      this.recordTest('Data Updates', true, 'All data updates verified');
    } catch (error) {
      this.recordTest('Data Updates', false, error.message);
      console.log('❌ Data updates verification failed:', error.message);
      throw error;
    }
  }

  /**
   * Test 7: Cleanup test data
   */
  async cleanupTestData() {
    console.log('\n🧹 Test 7: Cleaning Up Test Data...');

    try {
      // Delete test objects (in reverse order of creation)
      if (this.testData?.approval?.id) {
        await this.hubspotService.deleteApproval(this.testData.approval.id);
        console.log('✅ Deleted test approval');
      }

      if (this.testData?.timesheet?.id) {
        await this.hubspotService.deleteTimesheet(this.testData.timesheet.id);
        console.log('✅ Deleted test timesheet');
      }

      if (this.testData?.contact?.id) {
        await this.hubspotService.deleteContact(this.testData.contact.id);
        console.log('✅ Deleted test contact');
      }

      this.recordTest('Cleanup', true, 'Test data cleaned up successfully');
    } catch (error) {
      this.recordTest('Cleanup', false, error.message);
      console.log('⚠️ Cleanup failed (non-critical):', error.message);
    }
  }

  /**
   * Create test contact
   */
  async createTestContact() {
    const contactData = {
      email: `test-${Date.now()}@hjpetro.com`,
      firstname: 'Test',
      lastname: 'Approver',
      company: 'H&J Petroleum Test',
      phone: '555-0123'
    };

    return await this.hubspotService.createContact(contactData);
  }

  /**
   * Create test timesheet
   */
  async createTestTimesheet(contactId) {
    const timesheetData = {
      consultant_id: contactId,
      project_name: 'Sandbox Test Project',
      from_date: '2025-01-01',
      until_date: '2025-01-07',
      total_hours: 40,
      timesheet_approval_status: 'Pending',
      invoice_number_second_part: '0001'
    };

    return await this.hubspotService.createTimesheet(timesheetData);
  }

  /**
   * Create test approval
   */
  async createTestApproval(contactId, timesheetId) {
    const approvalData = {
      response_approval_consultant_id: contactId,
      response_approval_timesheet_ids_array: timesheetId.toString(),
      response_approval_from_date: '2025-01-01',
      response_approval_until_date: '2025-01-07',
      response_approval_project_name: 'Sandbox Test Project',
      response_approval_customer: 'Test Customer',
      response_approval_operator: 'Test Operator',
      approval_approve_reject: 'Approve',
      approval_processed_date: new Date().toISOString(),
      response_approval_customer_comment: 'Test approval via sandbox API'
    };

    return await this.hubspotService.createApproval(approvalData);
  }

  /**
   * Record test result
   */
  recordTest(testName, passed, message) {
    this.testResults.tests.push({
      name: testName,
      passed,
      message,
      timestamp: new Date().toISOString()
    });

    if (passed) {
      this.testResults.passed++;
    } else {
      this.testResults.failed++;
    }
  }

  /**
   * Print test results
   */
  printTestResults() {
    console.log('\n📊 Test Results Summary:');
    console.log('========================');
    console.log(`✅ Passed: ${this.testResults.passed}`);
    console.log(`❌ Failed: ${this.testResults.failed}`);
    console.log(`📈 Success Rate: ${((this.testResults.passed / (this.testResults.passed + this.testResults.failed)) * 100).toFixed(1)}%`);

    console.log('\n📋 Detailed Results:');
    this.testResults.tests.forEach((test, index) => {
      const status = test.passed ? '✅' : '❌';
      console.log(`${index + 1}. ${status} ${test.name}: ${test.message}`);
    });

    if (this.testResults.failed === 0) {
      console.log('\n🎉 All tests passed! Your API implementation is ready for production.');
    } else {
      console.log('\n⚠️ Some tests failed. Please review the issues before proceeding.');
    }
  }
}

// Run the tests
if (require.main === module) {
  const test = new SandboxApprovalTest();
  test.runTests().catch(console.error);
}

module.exports = SandboxApprovalTest;
