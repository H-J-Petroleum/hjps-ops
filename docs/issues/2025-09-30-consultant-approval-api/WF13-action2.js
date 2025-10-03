/* UPDATE STATUSES IN TIMESHEETS CUSTOM OBJECT */
const hubspot = require('@hubspot/api-client');

exports.main = async (event) => {
  
  const hubspotContacts = new hubspot.Client({
    accessToken: process.env.MyContacts
  });
  const hubspotObjects = new hubspot.Client({
    accessToken: process.env.MyCustomObject
  });
  
  /* 01. GET INFO */
  let getSubmittedAsTimesjeetContact;
  let getConsultantContactId;
  let getConsultantEmail;
  let getConsultantName;
  let getProjectName;
  let getProjectId;
  let getCustomer;
  let getOperator;
  let getApproverName;
  let getApproverEmail;
  let getApproverId;
  let getWhoIsApprover;
  let getSalesDealId;
  let getSalesDealOwnerEmail;
  let getSalesDealOwnerName;
  let getFromDate;
  let getUntilDate;
  let getProcessedDate;
  try {
    const ApiResponse1 = await hubspotContacts.crm.contacts.basicApi.getById(event.object.objectId, ["submitted_as_timesheet_contact", "hs_object_id", "main_contact_id", "email", "main_contact_email", "approval_project_name", "approval_project_id", "approval_customer", "approval_operator", "approval_consultant_name", "approver_full_name", "approver_email", "approver_unique_id", "approver_is", "approval_sales_deal_id", "approval_sales_deal_owner_email", "approval_sales_deal_owner_full_name", "approval_from_date", "approval_until_date", "approval_processed_date"]);
    getSubmittedAsTimesjeetContact = ApiResponse1.properties.submitted_as_timesheet_contact;
    if(getSubmittedAsTimesjeetContact == 'No'){
      getConsultantContactId = ApiResponse1.properties.hs_object_id;
      getConsultantEmail = ApiResponse1.properties.email;
    }else if(getSubmittedAsTimesjeetContact == 'Yes'){
      getConsultantContactId = ApiResponse1.properties.main_contact_id;
      getConsultantEmail = ApiResponse1.properties.main_contact_email;
    }
    getConsultantName = ApiResponse1.properties.approval_consultant_name;
    getProjectName = ApiResponse1.properties.approval_project_name;
    getProjectId = ApiResponse1.properties.approval_project_id;
    getCustomer = ApiResponse1.properties.approval_customer;
    getOperator = ApiResponse1.properties.approval_operator;
    getApproverName = ApiResponse1.properties.approver_full_name;
    getApproverEmail = ApiResponse1.properties.approver_email;
    getApproverId = ApiResponse1.properties.approver_unique_id;
    getWhoIsApprover = ApiResponse1.properties.approver_is;
    getSalesDealId = ApiResponse1.properties.approval_sales_deal_id;
    getSalesDealOwnerEmail = ApiResponse1.properties.approval_sales_deal_owner_email;
    getSalesDealOwnerName = ApiResponse1.properties.approval_sales_deal_owner_full_name;
    getFromDate = ApiResponse1.properties.approval_from_date;
    getUntilDate = ApiResponse1.properties.approval_until_date;
    getProcessedDate = ApiResponse1.properties.approval_processed_date;
  } catch (err) {
    console.error(err);
    throw err;
  }
  
  /* CREATE UNIQUE APPROVAL REQUEST ID */
  let setUniqueNumber = Math.floor(Date.now() + (Math.floor(Math.random()*90000) + 10000));
  let setTimesheetApprovalRequestId = getProjectId + '-' + getConsultantContactId + '-' + setUniqueNumber;
  console.log(setTimesheetApprovalRequestId);
  
  /* 02. CREATE UNIQUE HJ APPROVAL RECORD */
  let getHjApprovalRecordId;
  try {
    const ApiResponse2 = await hubspotObjects
    .apiRequest({
      method: 'POST',
      path: '/crm/v3/objects/2-26103010',
      body: {
        "properties": {
          "project_name": getProjectName,
          "approval_customer": getCustomer,
          "approval_operator": getOperator,
          "approval_project_id": getProjectId,
          "approval_request_id": setTimesheetApprovalRequestId,
          "approval_approval_status": "Submitted",
          "approval_status_date":  getProcessedDate,
          "approval_approval_from": getFromDate,
          "approval_approval_until": getUntilDate,
          "approval_consultant_name": getConsultantName,
          "approval_consultant_email": getConsultantEmail,
          "approval_consultant_id": getConsultantContactId,
          "approval_approver_name": getApproverName,
          "approval_approver_is_": getWhoIsApprover,
          "approval_approver_email": getApproverEmail,
          "approval_approver_id": getApproverId,
          "approval_sales_deal_id": getSalesDealId,
          "approval_sales_deal_owner_name": getSalesDealOwnerName,
          "approval_sales_deal_owner_email": getSalesDealOwnerEmail         
        }
      }
    });
    const ApiResponse_2 = await ApiResponse2.json();
    getHjApprovalRecordId = ApiResponse_2.id;
  } catch (err) {
    console.error(err);
    throw err;
  }

  /* 02. UPDATE CONSULTANT CONTACT WITH UNIQUE APPROVAL REQUEST ID */
  try {
    const ApiResponse3 = await hubspotContacts
    .apiRequest({
      method: 'PATCH',
      path: '/crm/v3/objects/contacts/' + getConsultantContactId,
      body: {
        "properties": {
          "approval_request_id": setTimesheetApprovalRequestId,
          "approval_object_record_id": getHjApprovalRecordId
        }
      }
    });
    console.log("Consultant Contact is Updated");
  } catch (err) {
    console.error(err);
    throw err;
  }
}