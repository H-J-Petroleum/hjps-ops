#!/usr/bin/env node

/**
 * Check Timesheet Properties
 * Check what properties our sandbox timesheet object actually has
 */

const axios = require('axios');

async function checkTimesheetProperties() {
  console.log('🔍 Checking Timesheet Properties...\n');

  const sandboxToken = process.env.HUBSPOT_SANDBOX_ACCESS_TOKEN;

  if (!sandboxToken) {
    throw new Error('HUBSPOT_SANDBOX_ACCESS_TOKEN environment variable is required');
  }

  try {
    const response = await axios.get(`https://api.hubapi.com/crm/v3/objects/2-50490321/35693058397`, {
      headers: {
        'Authorization': `Bearer ${sandboxToken}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ Timesheet object retrieved successfully');
    console.log('Properties:', JSON.stringify(response.data.properties, null, 2));

  } catch (error) {
    console.error('❌ Failed to retrieve timesheet object:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

// Run the check
checkTimesheetProperties().catch(console.error);
