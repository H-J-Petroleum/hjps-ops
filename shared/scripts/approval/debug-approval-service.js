#!/usr/bin/env node

/**
 * Debug Approval Service
 * Test the exact same flow as the approval service
 */

const ApprovalService = require('../src/approval-api/src/services/approvalService');

async function debugApprovalService() {
  console.log('🔍 Debugging Approval Service...\n');

  const approvalService = new ApprovalService();

  try {
    // Test with the same parameters as our failing test
    console.log('📋 Testing resolveContext with approvalId...');
    const context = await approvalService.resolveContext({
      approvalRequestId: '35674383001'
    });

    console.log('✅ Context resolved successfully');
    console.log('Context approvalRequestId:', context.approvalRequestId);

    // Test validation
    const validation = approvalService.urlResolver.validateContext(context);
    console.log('\n📋 Validation result:', JSON.stringify(validation, null, 2));

    if (!validation.isValid) {
      console.log('❌ Context validation failed');
      console.log('Missing fields:', validation.missingFields);
    } else {
      console.log('✅ Context validation passed');
    }

  } catch (error) {
    console.error('❌ Approval service test failed:', error.message);
    console.error('Stack:', error.stack);
  }
}

// Run the debug
debugApprovalService().catch(console.error);
