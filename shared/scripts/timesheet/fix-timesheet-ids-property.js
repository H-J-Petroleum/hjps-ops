#!/usr/bin/env node

/**
 * Fix Timesheet IDs Property
 * Update the approval object to have the correct property name for timesheet IDs
 */

const axios = require('axios');

async function fixTimesheetIdsProperty() {
  console.log('🔧 Fixing Timesheet IDs Property...\n');

  const sandboxToken = process.env.HUBSPOT_SANDBOX_ACCESS_TOKEN;

  if (!sandboxToken) {
    throw new Error('HUBSPOT_SANDBOX_ACCESS_TOKEN environment variable is required');
  }

  try {
    // Update the approval object to have the correct property name for timesheet IDs
    const updateData = {
      properties: {
        timesheet_ids: '35693058397' // The timesheet ID the service expects
      }
    };

    console.log('📝 Adding timesheet_ids property to approval object...');
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

// Run the fix
fixTimesheetIdsProperty().catch(console.error);
