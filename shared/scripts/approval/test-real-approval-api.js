#!/usr/bin/env node

/**
 * Test Real Approval via API
 * Test the real production approval URL using our existing API endpoint
 */

const axios = require('axios');

class RealApprovalApiTester {
  constructor() {
    this.apiBaseUrl = 'http://localhost:3001'; // Approval API port
    this.realApprovalUrl = 'https://hjpetro-1230608.hs-sites.com/hj-field-ticket-for-approval-step-01?project_id=hjp-68429-50156&approval_request_id=hjp-68429-50156-114401-1759188306190&customer_email=nsmith%40eltororesources.com&consultant_id=117923&approver_is=HJPetro&sales_deal_id=38777299476&utm_medium=email&_hsenc=p2ANqtz--d2BNtDxS_Pt52fg2cZ01FqUK8iOIMbs7nT0mC2v62MSBwszoR7z-kFjywcO4NOt_SZpi4ehq228XOyWxIqjTv4m8n-Q&_hsmi=299542408&utm_content=299542408&utm_source=hs_automation';
  }

  async testApprovalApi() {
    console.log('🎯 Testing Real Production Approval via API...\n');
    console.log('📋 Approval URL:');
    console.log(`   ${this.realApprovalUrl}\n`);

    try {
      // Test 1: Parse the URL first
      await this.testUrlParsing();
      
      // Test 2: Process the approval (Approve)
      await this.testApprovalProcess('Approve');
      
      // Test 3: Process the approval (Reject) - if you want to test both
      // await this.testApprovalProcess('Reject');
      
    } catch (error) {
      console.error('❌ Real approval API test failed:', error.message);
      throw error;
    }
  }

  async testUrlParsing() {
    console.log('🔍 Test 1: URL Parsing...');
    
    try {
      const response = await axios.post(`${this.apiBaseUrl}/api/approval/parse-url`, {
        approvalUrl: this.realApprovalUrl
      });

      if (response.data.success) {
        console.log('✅ URL parsed successfully');
        console.log('📋 Parsed Context:');
        console.log(`   - Approval Request ID: ${response.data.data.context.approvalRequestId}`);
        console.log(`   - Project ID: ${response.data.data.context.projectId}`);
        console.log(`   - Consultant ID: ${response.data.data.context.consultantId}`);
        console.log(`   - Customer Email: ${response.data.data.context.customerEmail}`);
        console.log(`   - Approver Type: ${response.data.data.context.approverType}`);
        console.log(`   - Sales Deal ID: ${response.data.data.context.salesDealId}`);
        
        console.log('\n✅ Validation:');
        console.log(`   - Valid: ${response.data.data.validation.isValid}`);
        if (response.data.data.validation.warnings.length > 0) {
          console.log(`   - Warnings: ${response.data.data.validation.warnings.join(', ')}`);
        }
        
        return response.data.data.context;
        
      } else {
        throw new Error('URL parsing failed');
      }
      
    } catch (error) {
      console.error('❌ URL parsing failed:', error.response?.data?.error?.message || error.message);
      throw error;
    }
  }

  async testApprovalProcess(decision) {
    console.log(`\n⚙️ Test 2: Processing Approval (${decision})...`);
    
    try {
      const response = await axios.post(`${this.apiBaseUrl}/api/approval/process`, {
        approvalUrl: this.realApprovalUrl,
        decision: decision,
        comments: `Real approval test - ${decision} decision via API integration`,
        pdfType: 'customer'
      });

      if (response.data.success) {
        console.log(`✅ Approval ${decision} processed successfully!`);
        console.log('📋 Results:');
        
        const result = response.data.data;
        
        if (result.pdfResult) {
          console.log(`   - PDF generated: Yes`);
          console.log(`   - PDF File ID: ${result.pdfResult.fileId}`);
          console.log(`   - PDF URL: ${result.pdfResult.url}`);
        } else {
          console.log(`   - PDF generated: No`);
        }
        
        if (result.timesheetResult) {
          console.log(`   - Timesheets processed: Yes`);
          console.log(`   - Timesheet count: ${result.timesheetResult.timesheetCount}`);
        } else {
          console.log(`   - Timesheets processed: No`);
        }
        
        if (result.emailResult && result.emailResult.length > 0) {
          console.log('\n📧 Email Results:');
          result.emailResult.forEach((email, index) => {
            console.log(`   ${index + 1}. Type: ${email.type}`);
            console.log(`      Recipient: ${email.recipient}`);
            console.log(`      Status: ${email.status}`);
          });
        } else {
          console.log(`   - Emails sent: No`);
        }
        
        console.log(`\n🎉 Real approval ${decision} completed successfully!`);
        console.log(`📧 Check nsmith@eltororesources.com for the approval email!`);
        
      } else {
        console.log(`❌ Approval ${decision} failed:`, response.data.error?.message);
        throw new Error(`Approval ${decision} failed: ${response.data.error?.message}`);
      }
      
    } catch (error) {
      console.error(`❌ Approval ${decision} process failed:`, error.response?.data?.error?.message || error.message);
      throw error;
    }
  }
}

// Run the tester
async function main() {
  try {
    const tester = new RealApprovalApiTester();
    await tester.testApprovalApi();
  } catch (error) {
    console.error('❌ Real approval API test failed:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = RealApprovalApiTester;
