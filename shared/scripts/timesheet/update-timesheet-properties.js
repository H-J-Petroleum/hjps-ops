#!/usr/bin/env node

/**
 * Update Timesheet Properties
 * Update the timesheet object with the properties the PDF generator expects
 */

const axios = require('axios');

async function updateTimesheetProperties() {
  console.log('🔧 Updating Timesheet Properties...\n');

  const sandboxToken = process.env.HUBSPOT_SANDBOX_ACCESS_TOKEN;

  if (!sandboxToken) {
    throw new Error('HUBSPOT_SANDBOX_ACCESS_TOKEN environment variable is required');
  }

  try {
    // Update the timesheet object with the properties the PDF generator expects
    const updateData = {
      properties: {
        // Properties the PDF generator expects
        timesheet_project_name: 'Sandbox Test Project - Minimal',
        timesheet_customer: 'Test Customer Corp',
        timesheet_operator: 'Test Operator LLC',
        timesheet_consultant_id: '159593443620',
        timesheet_consultant_email: 'test-consultant@hjpetro.com',
        timesheet_consultant_full_name: 'Test Consultant',
        timesheet_well: 'Test Well 1',
        timesheet_role: 'Field Consultant',
        timesheet_job_service: 'Consulting Services',
        timesheet_billing_frequency: 'Weekly',
        timesheet_hj_price: '150.00',
        timesheet_price: '150.00',
        timesheet_quantity: '40',
        timesheet_hj_total_price: '6000.00',
        timesheet_total_price: '6000.00',
        timesheet_start_date: '2025-01-01',
        timesheet_end_date: '2025-01-07',
        timesheet_start_time: '08:00',
        timesheet_end_time: '17:00',
        timesheet_all_dates: '2025-01-01,2025-01-02,2025-01-03,2025-01-04,2025-01-05',
        timesheet_approval_status: 'Created',
        timesheet_ordinal_number: '1',
        timesheet_payment_deal_id: '44953357833'
      }
    };

    console.log('📝 Updating timesheet object with PDF generator properties...');
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
updateTimesheetProperties().catch(console.error);
