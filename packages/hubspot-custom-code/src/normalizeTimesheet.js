/**
 * Normalizes timesheet data from HubSpot form submissions
 * Used in HubSpot Workflow: "Timesheet Submission Processing"
 * 
 * @param {Object} data - The input data from HubSpot form
 * @returns {Object} - Normalized timesheet data
 */
exports.main = (data) => {
  // Input validation
  if (!data || !data.hours || !data.project_code) {
    throw new Error('Invalid timesheet data: missing required fields');
  }
  
  // Normalize hours (convert string to number and round to nearest 0.25)
  let hours = parseFloat(data.hours);
  if (isNaN(hours)) {
    throw new Error('Invalid hours format');
  }
  
  // Round to nearest quarter hour
  hours = Math.round(hours * 4) / 4;
  
  // Normalize project code (uppercase, trim whitespace)
  const projectCode = data.project_code.trim().toUpperCase();
  
  // Construct normalized data
  const normalizedData = {
    hours,
    project_code: projectCode,
    employee_id: data.employee_id,
    submission_date: data.submission_date || new Date().toISOString(),
    status: 'pending_approval',
    // Added timestamp for better tracking  
    processed_at: new Date().toISOString(),
    // Test deployment with Personal Access Keys
    deployment_test: true
  };
  
  return normalizedData;
}; 