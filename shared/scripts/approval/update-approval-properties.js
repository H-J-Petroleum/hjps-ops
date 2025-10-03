#!/usr/bin/env node

/**
 * Update Approval Properties
 * Update the approval object with the properties the PDF generator expects
 */

const axios = require('axios');

async function updateApprovalProperties() {
  console.log('🔧 Updating Approval Properties...\n');

  const sandboxToken = process.env.HUBSPOT_SANDBOX_ACCESS_TOKEN;

  if (!sandboxToken) {
    throw new Error('HUBSPOT_SANDBOX_ACCESS_TOKEN environment variable is required');
  }

  try {
    // Update the approval object with the properties the PDF generator expects
    const updateData = {
      properties: {
        // Properties the PDF generator expects
        approval_request_id: 'hjp-test-35674383001',
        approval_project_id: 'hjp-test-project-35674383001',
        approval_consultant_id: '159593443620', // Our test contact ID
        approval_consultant_name: 'Test Consultant',
        approval_approver_name: 'Test Approver',
        approval_approver_email: 'test-approver@hjpetro.com',
        approval_approver_is_: 'HJPetro',

        // Additional properties for PDF generation
        signature_new: 'Test Signature',
        consultant_timesheet_approval_url: 'https://test.com/approval'
      }
    };

    console.log('📝 Updating approval object with PDF generator properties...');
    console.log('Update data:', JSON.stringify(updateData.properties, null, 2));

    const response = await axios.patch(`https://api.hubapi.com/crm/v3/objects/2-50490319/35674383001`, updateData, {
      headers: {
        'Authorization': `Bearer ${sandboxToken}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ Approval object updated successfully');
    console.log('Updated properties:', JSON.stringify(response.data.properties, null, 2));

  } catch (error) {
    console.error('❌ Failed to update approval object:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

// Run the update
updateApprovalProperties().catch(console.error);
