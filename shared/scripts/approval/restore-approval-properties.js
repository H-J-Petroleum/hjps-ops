#!/usr/bin/env node

/**
 * Restore Approval Properties
 * Restore all the properties the approval object needs for the workflow
 */

const axios = require('axios');

async function restoreApprovalProperties() {
  console.log('🔧 Restoring Approval Properties...\n');

  const sandboxToken = process.env.HUBSPOT_SANDBOX_ACCESS_TOKEN;

  if (!sandboxToken) {
    throw new Error('HUBSPOT_SANDBOX_ACCESS_TOKEN environment variable is required');
  }

  try {
    // Restore all the properties the approval object needs
    const updateData = {
      properties: {
        // Properties the PDF generator expects
        approval_request_id: 'hjp-test-35674383001',
        approval_project_id: 'hjp-test-project-35674383001',
        approval_consultant_id: '159593443620',
        approval_consultant_name: 'Test Consultant',
        approval_approver_name: 'Test Approver',
        approval_approver_email: 'test-approver@hjpetro.com',
        approval_approver_is_: 'HJPetro',
        signature_new: 'Test Signature',
        consultant_timesheet_approval_url: 'https://test.com/approval',

        // Properties the timesheet service expects
        response_approval_timesheet_ids_array: '35693058397',

        // Additional properties
        approval_approval_status: 'Submitted',
        approval_customer: 'Test Customer Corp',
        project_name: 'Sandbox Test Project - Minimal'
      }
    };

    console.log('📝 Restoring all approval properties...');
    console.log('Update data:', JSON.stringify(updateData.properties, null, 2));

    const response = await axios.patch(`https://api.hubapi.com/crm/v3/objects/2-50490319/35674383001`, updateData, {
      headers: {
        'Authorization': `Bearer ${sandboxToken}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ Approval object restored successfully');
    console.log('Updated properties:', JSON.stringify(response.data.properties, null, 2));

  } catch (error) {
    console.error('❌ Failed to restore approval object:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

// Run the restore
restoreApprovalProperties().catch(console.error);
