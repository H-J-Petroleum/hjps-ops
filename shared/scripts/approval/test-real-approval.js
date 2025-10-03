#!/usr/bin/env node

/**
 * Test Real Approval
 * Test the approval workflow with a real production approval URL
 */

const fs = require('fs');
const path = require('path');
const util = require('util');
const { URL } = require('url');
const ApprovalService = require('../src/approval-api/src/services/approvalService');

class RealApprovalTester {
  constructor(approvalUrl) {
    this.sandboxToken = process.env.HUBSPOT_SANDBOX_ACCESS_TOKEN
      || process.env.HUBSPOT_PRIVATE_APP_TOKEN;

    if (!this.sandboxToken) {
      throw new Error('Set HUBSPOT_PRIVATE_APP_TOKEN (or HUBSPOT_SANDBOX_ACCESS_TOKEN) before running the real approval tester.');
    }

    if (!approvalUrl) {
      throw new Error('Provide an approval URL via --url "<approval-link>".');
    }

    this.approvalUrl = approvalUrl;
    this.approvalService = new ApprovalService();

    this.realApprovalData = this.parseApprovalUrl(approvalUrl);
  }

  parseApprovalUrl(approvalUrl) {
    try {
      const parsed = new URL(approvalUrl);
      const params = parsed.searchParams;

      const projectId = params.get('project_id');
      const approvalRequestId = params.get('approval_request_id');
      const customerEmail = params.get('customer_email');
      const consultantId = params.get('consultant_id');
      const approverType = params.get('approver_is') || 'HJPetro';
      const salesDealId = params.get('sales_deal_id');

      if (!approvalRequestId) {
        throw new Error('approval_request_id missing from approval URL');
      }

      return {
        projectId,
        approvalRequestId,
        customerEmail,
        consultantId,
        approverType,
        salesDealId
      };
    } catch (error) {
      throw new Error(`Failed to parse approval URL: ${error.message}`);
    }
  }

  async testRealApproval() {
    console.log('🎯 Testing Real Production Approval...\n');
    console.log('📋 Approval Details:');
    console.log(`   - Project ID: ${this.realApprovalData.projectId}`);
    console.log(`   - Approval Request ID: ${this.realApprovalData.approvalRequestId}`);
    console.log(`   - Customer Email: ${this.realApprovalData.customerEmail}`);
    console.log(`   - Consultant ID: ${this.realApprovalData.consultantId}`);
    console.log(`   - Approver Type: ${this.realApprovalData.approverType}`);
    console.log(`   - Sales Deal ID: ${this.realApprovalData.salesDealId}\n`);

    try {
      // Test 1: Resolve context from the real approval URL
      await this.testContextResolution();
      
      // Test 2: Process the real approval (Approve)
      await this.testApprovalProcess('Approve');
      
      // Test 3: Process the real approval (Reject) - if you want to test both
      // await this.testApprovalProcess('Reject');
      
    } catch (error) {
      console.error('❌ Real approval test failed:', error.message);
      throw error;
    }
  }

  async testContextResolution() {
    console.log('🔍 Test 1: Context Resolution...');
    
    try {
      const context = await this.approvalService.resolveContext({
        approvalUrl: this.approvalUrl,
        approvalRequestId: this.realApprovalData.approvalRequestId,
        customerEmail: this.realApprovalData.customerEmail || undefined
      });

      console.log('✅ Context resolved successfully');
      console.log(`   - Approval Request ID: ${context.approvalRequestId}`);
      console.log(`   - Project ID: ${context.projectId}`);
      console.log(`   - Consultant ID: ${context.consultantId}`);
      console.log(`   - Customer Email: ${context.customerEmail}`);
      console.log(`   - Approver Type: ${context.approverType}`);
      
      return context;
      
    } catch (error) {
      console.error('❌ Context resolution failed:', error.message);
      throw error;
    }
  }

  async testApprovalProcess(decision) {
    console.log(`\n⚙️ Test 2: Processing Approval (${decision})...`);
    
    try {
      const result = await this.approvalService.processApproval({
        approvalUrl: this.approvalUrl,
        approvalId: this.realApprovalData.approvalRequestId,
        decision: decision,
        comments: `Real approval test - ${decision} decision via API integration`,
        pdfType: 'customer'
      });

      if (result.success) {
        console.log(`✅ Approval ${decision} processed successfully!`);
        console.log(`   - PDF generated: ${result.pdfResult ? 'Yes' : 'No'}`);
        console.log(`   - Timesheets processed: ${result.timesheetResult ? 'Yes' : 'No'}`);
        console.log(`   - Emails sent: ${result.emailResult ? 'Yes' : 'No'}`);
        
        if (result.pdfResult) {
          console.log(`   - PDF File ID: ${result.pdfResult.fileId}`);
          console.log(`   - PDF URL: ${result.pdfResult.url}`);
        }
        
        if (result.emailResult && result.emailResult.length > 0) {
          console.log('\n📧 Email Results:');
          result.emailResult.forEach((email, index) => {
            console.log(`   ${index + 1}. Type: ${email.type}`);
            console.log(`      Recipient: ${email.recipient}`);
            console.log(`      Status: ${email.status}`);
          });
        }
        
        console.log(`\n🎉 Real approval ${decision} completed successfully!`);
        if (this.realApprovalData.customerEmail) {
          console.log(`📧 Check ${this.realApprovalData.customerEmail} for the approval email!`);
        }

      } else {
        console.log(`❌ Approval ${decision} failed:`, result.error);
        throw new Error(`Approval ${decision} failed: ${result.error}`);
      }
      
    } catch (error) {
      console.error(`❌ Approval ${decision} process failed:`, error.message);
      throw error;
    }
  }
}

// Run the tester
function parseArgs() {
    const args = process.argv.slice(2);
    const parsed = {};

    for (let i = 0; i < args.length; i += 1) {
      const arg = args[i];
      if (arg === '--url' && i + 1 < args.length) {
        parsed.url = args[i + 1];
        i += 1;
      } else if (arg === '--log' && i + 1 < args.length) {
        parsed.logFile = args[i + 1];
        i += 1;
      }
    }

    return parsed;
  }

function setupLogging(customLogFileName) {
  const logsDir = path.resolve(__dirname, '..', 'logs');
  fs.mkdirSync(logsDir, { recursive: true });

  const defaultFileName = `real-approval-${new Date().toISOString().replace(/[:.]/g, '-')}.log`;
  const logFilePath = path.isAbsolute(customLogFileName || '')
    ? customLogFileName
    : path.join(logsDir, customLogFileName || defaultFileName);

  const logStream = fs.createWriteStream(logFilePath, { flags: 'a' });

  const original = {
    log: console.log.bind(console),
    info: console.info.bind(console),
    warn: console.warn.bind(console),
    error: console.error.bind(console)
  };

  const createLogger = (levelName, fallback) => (...args) => {
    const message = util.format(...args);
    const timestamp = new Date().toISOString();
    logStream.write(`${timestamp} ${levelName.toUpperCase()}: ${message}\n`);
    fallback(...args);
  };

  console.log = createLogger('log', original.log);
  console.info = createLogger('info', original.info);
  console.warn = createLogger('warn', original.warn);
  console.error = createLogger('error', original.error);

  return {
    logFilePath,
    restore: () => {
      console.log = original.log;
      console.info = original.info;
      console.warn = original.warn;
      console.error = original.error;
      logStream.end();
    }
  };
}

async function main() {
  let logging;
  try {
    const args = parseArgs();
    const { url, logFile } = args;

    logging = setupLogging(logFile);
    console.log(`📝 Logging output to ${logging.logFilePath}`);

    const tester = new RealApprovalTester(url);
    await tester.testRealApproval();

    console.log(`✅ Logs saved to ${logging.logFilePath}`);
    logging.restore();
  } catch (error) {
    if (logging) {
      console.error(`❌ Real approval test failed: ${error.message}`);
      console.error(`📄 Partial logs saved to ${logging.logFilePath}`);
      logging.restore();
    } else {
      console.error('❌ Real approval test failed:', error.message);
    }
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = RealApprovalTester;
