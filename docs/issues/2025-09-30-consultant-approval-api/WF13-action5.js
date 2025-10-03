/* PREPARE SENDING MARKETING EMAIL TO APPROVER (CUSTOMER) FOR TIMESHEET APPROVAL */
const hubspot = require('@hubspot/api-client');

exports.main = async (event, callback) => {
  
  const hubspotContacts = new hubspot.Client({
    accessToken: process.env.MyContacts
  });

  /* 01. GET INFO */
  let getSubmittedAsTimesheetContact;
  let getConsultantId;
  let getApproverContactId;
  let getProjectId;
  let getApprovalRequestId;
  let getApproverEmail;
  let getSalesDealId;
  let getWhoIsApprover;
  try {
    const ApiResponse1 = await hubspotContacts.crm.contacts.basicApi.getById(event.object.objectId, ["submitted_as_timesheet_contact", "hs_object_id", "main_contact_id", "approver_unique_id", "approval_project_id", "approval_request_id", "approver_email", "approval_sales_deal_id", "approver_is"]);
    getSubmittedAsTimesheetContact = ApiResponse1.properties.submitted_as_timesheet_contact;
    if(getSubmittedAsTimesheetContact == 'No'){
      getConsultantId = ApiResponse1.properties.hs_object_id;
      getApprovalRequestId = ApiResponse1.properties.approval_request_id;
    }else if(getSubmittedAsTimesheetContact == 'Yes'){
      getConsultantId = ApiResponse1.properties.main_contact_id;
    }
    getApproverContactId = ApiResponse1.properties.approver_unique_id;
    getProjectId = ApiResponse1.properties.approval_project_id;
    getApproverEmail = ApiResponse1.properties.approver_email;
    getSalesDealId = ApiResponse1.properties.approval_sales_deal_id;
    getWhoIsApprover = ApiResponse1.properties.approver_is;
  } catch (err) {
    console.error(err);
    throw err;
  }
  
  if(getSubmittedAsTimesheetContact == 'Yes'){
    try {
      const ApiResponse1_2 = await hubspotContacts.crm.contacts.basicApi.getById(getConsultantId, ["approval_request_id"]);
      getApprovalRequestId = ApiResponse1_2.properties.approval_request_id;
    } catch (err) {
      console.error(err);
      throw err;
    }
  }
 
  /* ENCRYPT CONSULTANT ID */
  let encryptedConsultantId = parseInt(getConsultantId);
  encryptedConsultantId = encryptedConsultantId + 3522;
  console.log("Encrypted Consultant Id: " + encryptedConsultantId)
  
  /* CREATE MARKETING EMAIL LINK */
  let setMarketingEmailLink = "https://hjpetro-1230608.hs-sites.com/field-ticket-for-approval-step-01?project_id=" + getProjectId + "&approval_request_id=" + getApprovalRequestId + "&customer_email=" + getApproverEmail + "&consultant_id=" + encryptedConsultantId + "&approver_is=" + getWhoIsApprover + "&sales_deal_id=" + getSalesDealId;
  
  /* CREATE MARKETING EMAIL BUTTON */
  let createMarketingEmailButton = '<p><a style=\"font-size: 18px; font-weight: bold; text-transform: uppercase; text-decoration: underline; color: #c20000; margin-top: 16px; margin-bottom: 24px;\" href=\"' + setMarketingEmailLink + '" rel=\"nofollow noopener\">Approve or Reject The Timesheet</a></p>';
  
  let setApprovalRequestType = 'Approval Request for Customer';
  console.log(setApprovalRequestType);
  
  /* 02. UPDATE APPROVER/CUSTOMER CONTACT MARKETING EMAIL LINK */
  try {
    const ApiResponse2 = await hubspotContacts
    .apiRequest({
      method: 'PATCH',
      path: '/crm/v3/objects/contacts/' + getApproverContactId,
      body: {
        "properties": {
          "send_approval_reminder": "FirstTime",
          "line_items_approval_link": createMarketingEmailButton,
          "approval_request_type": setApprovalRequestType
        }
      }
    });
    console.log("Approver/Customer Contact is Updated");

    callback({
    outputFields: {
      line_items_approval_link: createMarketingEmailButton
    }
  });
  } catch (err) {
    console.error(err);
    throw err;
  }
 
  

  
  
}