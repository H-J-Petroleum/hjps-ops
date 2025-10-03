const isValidEmail = (email) => {
  const re = /[^\s@]+@[^\s@]+\.[^\s@]+/;
  return re.test(String(email || '').toLowerCase());
};

const validateApprovalData = (approvalData) => {
  const errors = [];

  if (!approvalData || !approvalData.properties) {
    errors.push('Approval data is missing or invalid');
    return { isValid: false, errors };
  }

  const props = approvalData.properties;
  const requiredFields = [
    'approval_request_id',
    'approval_project_id',
    'approval_consultant_id',
    'approval_approver_name',
    'approval_approver_email'
  ];

  requiredFields.forEach((field) => {
    if (!props[field]) errors.push(`Required field missing: ${field}`);
  });

  if (props.approval_approver_email && !isValidEmail(props.approval_approver_email)) {
    errors.push('Invalid email format for approval_approver_email');
  }

  return { isValid: errors.length === 0, errors };
};

module.exports = { isValidEmail, validateApprovalData };

