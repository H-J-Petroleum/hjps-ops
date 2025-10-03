#!/usr/bin/env node

/**
 * Add Missing Timesheet Properties
 * Add the properties the PDF generator needs for searching
 */

const axios = require('axios');

async function addMissingTimesheetProperties() {
  console.log('🔧 Adding Missing Timesheet Properties...\n');

  const sandboxToken = process.env.HUBSPOT_SANDBOX_ACCESS_TOKEN;

  if (!sandboxToken) {
    throw new Error('HUBSPOT_SANDBOX_ACCESS_TOKEN environment variable is required');
  }

  try {
    // Add the missing properties the PDF generator needs for searching
    const updateData = {
      properties: {
        timesheet_project_id: 'hjp-test-project-35674383001',
        timesheet_approval_request_id: 'hjp-test-35674383001'
      }
    };

    console.log('📝 Adding missing search properties to timesheet...');
    console.log('Update data:', JSON.stringify(updateData.properties, null, 2));

    const response = await axios.patch(`https://api.hubapi.com/crm/v3/objects/2-50490321/35693058397`, updateData, {
      headers: {
        'Authorization': `Bearer ${sandboxToken}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ Timesheet object updated successfully');
    console.log('Updated properties:', JSON.stringify(response.data.properties, null, 2));

  } catch (error) {
    console.error('❌ Failed to update timesheet object:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

// Run the update
addMissingTimesheetProperties().catch(console.error);
