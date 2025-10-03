/**
 * Formats approval notification emails for timesheet submissions
 * Used in HubSpot Workflow: "Approval Notification"
 * 
 * @param {Object} data - The input data from HubSpot
 * @returns {Object} - Formatted email data
 */
exports.main = (data) => {
  // Input validation
  if (!data || !data.employee_name || !data.timesheet_data) {
    throw new Error('Invalid input data: missing required fields');
  }
  
  // Format timesheet data for email
  const timesheetRows = Array.isArray(data.timesheet_data) 
    ? data.timesheet_data 
    : [data.timesheet_data];
  
  let totalHours = 0;
  let tableRows = '';
  
  timesheetRows.forEach(row => {
    const hours = parseFloat(row.hours) || 0;
    totalHours += hours;
    
    tableRows += `
      <tr>
        <td style="padding: 8px; border: 1px solid #ddd;">${row.date || 'N/A'}</td>
        <td style="padding: 8px; border: 1px solid #ddd;">${row.project_code || 'N/A'}</td>
        <td style="padding: 8px; border: 1px solid #ddd;">${row.description || 'N/A'}</td>
        <td style="padding: 8px; border: 1px solid #ddd; text-align: right;">${hours.toFixed(2)}</td>
      </tr>
    `;
  });
  
  // Create email body with HTML formatting
  const emailBody = `
    <h2>Timesheet Approval Request</h2>
    <p>Employee: <strong>${data.employee_name}</strong></p>
    <p>Submission ID: ${data.submission_id || 'Unknown'}</p>
    <p>Total Hours: <strong>${totalHours.toFixed(2)}</strong></p>
    
    <table style="border-collapse: collapse; width: 100%;">
      <thead>
        <tr style="background-color: #f2f2f2;">
          <th style="padding: 8px; border: 1px solid #ddd;">Date</th>
          <th style="padding: 8px; border: 1px solid #ddd;">Project Code</th>
          <th style="padding: 8px; border: 1px solid #ddd;">Description</th>
          <th style="padding: 8px; border: 1px solid #ddd;">Hours</th>
        </tr>
      </thead>
      <tbody>
        ${tableRows}
      </tbody>
    </table>
    
    <div style="margin-top: 20px;">
      <a href="${data.approval_url || '#'}" style="padding: 10px 15px; background-color: #4CAF50; color: white; text-decoration: none; border-radius: 4px;">Approve Timesheet</a>
      <a href="${data.rejection_url || '#'}" style="padding: 10px 15px; background-color: #f44336; color: white; text-decoration: none; border-radius: 4px; margin-left: 10px;">Reject Timesheet</a>
    </div>
  `;
  
  return {
    email_subject: `Timesheet Approval: ${data.employee_name} - ${totalHours.toFixed(2)} hours`,
    email_body: emailBody,
    recipient: data.manager_email || data.fallback_approver,
    total_hours: totalHours
  };
}; 