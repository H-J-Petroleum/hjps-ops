/* CREATE TASK IN SALES DEAL AND ASSOCIATE IT */
const hubspot = require('@hubspot/api-client');

exports.main = async (event) => {
  
  const hubspotContacts = new hubspot.Client({
    accessToken: process.env.MyContacts
  });
  const hubspotDeals = new hubspot.Client({
    accessToken: process.env.MyDeals
  });
  const hubspotOwners = new hubspot.Client({
    accessToken: process.env.MyOwners
  });
  const hubspotObjects = new hubspot.Client({
    accessToken: process.env.MyCustomObject
  });
  
  /* 01. GET INFO FROM FORM SUBMISSION */
  let getSubmittedAsTimesheetContact;
  let getContactIdToSendInternalMarketingEmail;
  let getConsultantContactId;
  let getApprovalRequestId;
  let getApprovalObjectRecordId;
  let getConsultantName;
  let getProjectUniqueId;
  let getSalesDealId;
  let getFromDate;
  let getUntilDate;
  let getWhoIsApprover;
  let getApproverEmail;
  let getApproverContactId;
  try {
    const ApiResponse1 = await hubspotContacts.crm.contacts.basicApi.getById(event.object.objectId, ["submitted_as_timesheet_contact", "hs_object_id", "main_contact_id", "approval_request_id", "approval_object_record_id", "approval_consultant_name", "approval_project_id", "approval_sales_deal_id", "approval_from_date", "approval_until_date", "approval_request_id", "approver_is", "approver_email", "approver_full_name", "approver_unique_id"]);
    getSubmittedAsTimesheetContact = ApiResponse1.properties.submitted_as_timesheet_contact;
    if(getSubmittedAsTimesheetContact == 'No'){
      getConsultantContactId = ApiResponse1.properties.hs_object_id;
      getApprovalRequestId = ApiResponse1.properties.approval_request_id;
      getApprovalObjectRecordId = ApiResponse1.properties.approval_object_record_id;
    }else if(getSubmittedAsTimesheetContact == 'Yes'){
      getConsultantContactId = ApiResponse1.properties.main_contact_id;
    }
    getContactIdToSendInternalMarketingEmail = ApiResponse1.properties.hs_object_id;
    getConsultantName = ApiResponse1.properties.approval_consultant_name;
    getProjectUniqueId = ApiResponse1.properties.approval_project_id;
    getSalesDealId = ApiResponse1.properties.approval_sales_deal_id;   
    getFromDate = ApiResponse1.properties.approval_from_date;
    getUntilDate = ApiResponse1.properties.approval_until_date;
    getWhoIsApprover = ApiResponse1.properties.approver_is;
    getApproverEmail = ApiResponse1.properties.approver_email;
    getApproverContactId = ApiResponse1.properties.approver_unique_id;
  } catch (err) {
    console.error(err);
    throw err;
  }
  if(getSubmittedAsTimesheetContact == 'Yes'){
    try {
      const ApiResponse1_2 = await hubspotContacts.crm.contacts.basicApi.getById(getConsultantContactId, ["approval_request_id", "approval_object_record_id"]);
      getApprovalRequestId = ApiResponse1_2.properties.approval_request_id;
      getApprovalObjectRecordId = ApiResponse1_2.properties.approval_object_record_id;
    } catch (err) {
      console.error(err);
      throw err;
    }
  }
  /* 01-02. GET APPROVER OWNER ID */
  let getApproverOwnerId;
  try {
    const ApiResponse01_02 = await hubspotOwners
    .apiRequest({
      method: 'GET',
      path: '/crm/v3/owners/?email=' + getApproverEmail
    });
    const ApiResponse01_02a = await ApiResponse01_02.json();
    getApproverOwnerId = ApiResponse01_02a.results[0].id;
  } catch (err) {
    console.error(err);
    throw err;
  }
  console.log('Approver Owner Id: ' + getApproverOwnerId)
  
  /* ENCRYPT CONSULTANT ID */
  let encryptedConsultantId = parseInt(getConsultantContactId);
  encryptedConsultantId = encryptedConsultantId + 3522;
  console.log("Encrypted Consultant Id: " + encryptedConsultantId)
  
  /* 02. GET DEAL INFO */
  let getOwnerId;
  let getOwnerEmail;
  let getCustomerContactId;
  let getApprover;
  try {
    const ApiResponse2 = await hubspotDeals
    .apiRequest({
      method: 'GET',
      path: '/crm/v3/objects/deals/' + getSalesDealId + '?properties=hubspot_owner_id, hj_primary_customer_contact_id, owner_email, hj_approver_is'
    });
    const ApiResponse_2a = await ApiResponse2.json();
    getOwnerId = ApiResponse_2a.properties.hubspot_owner_id;
    getOwnerEmail = ApiResponse_2a.properties.owner_email;
    getCustomerContactId = ApiResponse_2a.properties.hj_primary_customer_contact_id;
    getApprover = ApiResponse_2a.properties.hj_approver_is;
  } catch (err) {
    console.error(err);
    throw err;
  }
 
  /* 03. GET CUSTOMER CONTACT INFO */
  let getCustomerContactEmail;
  try {
    const ApiResponse3 = await hubspotContacts
    .apiRequest({
      method: 'GET',
      path: '/crm/v3/objects/contacts/' + getCustomerContactId + '?properties=email'
    });
    const ApiResponse_3a = await ApiResponse3.json();
    getCustomerContactEmail = ApiResponse_3a.properties.email;
  } catch (err) {
    console.error(err);
    throw err;
  }
  
  /* CREATE VARIABLES FOR TASK */
  let createTaskLink = 'https://hjpetro-1230608.hs-sites.com/hj-field-ticket-for-approval-step-01?project_id=' + getProjectUniqueId + '&approval_request_id=' + getApprovalRequestId + '&customer_email=' + getCustomerContactEmail + '&consultant_id=' + encryptedConsultantId + '&approver_is=' + getWhoIsApprover + '&sales_deal_id=' + getSalesDealId;
  let createTaskButton = '<a href="' + createTaskLink + '" title="Approve or Reject The Timesheet" target="_blank">Approve or Reject The Timesheet</a>';
  let createInnerBodyText = 'Consultant </span><strong><span style="color: #333333;">' + getConsultantName + '</span></strong><span style="color: #333333;"> has requested Approval for the Timesheet for period from ' + getFromDate + ' until ' + getUntilDate + '</span></strong><br><span style="color: #333333;"> Approver is H&J Petroleum';    

  let createTaskBody = '<div dir="auto" data-top-level="true"><p style="margin:0; text-transform: none;"><span style="color: #333333;">' + createInnerBodyText + '</span></p><br><p style="margin:0; text-transform: uppercase;">' + createTaskButton + '</p></div>';
  let createTaskSubject = getConsultantName + ' Approval Request - ' + getFromDate + '-' + getUntilDate;
  var setDateTime;
  let getDateTimeNow = new Date();
  var a = new Date(getDateTimeNow);
  var days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  var dayOfWeek = days[a.getDay()];
  let time = '8:30';
  if(dayOfWeek == 'Friday'){
    setDateTime = (new Date(getDateTimeNow).setHours(...(time.split(/\D/))) + (86400000 * 3));
  } else if(dayOfWeek == 'Saturday'){
    setDateTime = (new Date(getDateTimeNow).setHours(...(time.split(/\D/))) + (86400000 * 2));
  } else{
    setDateTime = (new Date(getDateTimeNow).setHours(...(time.split(/\D/))) + 86400000);
  }
  
  /* 04. CREATE AND ASSOCIATE TASK */
  let getTaskId;
  try {
    const ApiResponse4 = await hubspotContacts
    .apiRequest({
      method: 'POST',
      path: '/crm/v3/objects/tasks',
      body: {
        "properties": {
          "hs_timestamp": setDateTime,
          "hs_task_body": createTaskBody,
          "hubspot_owner_id": getApproverOwnerId,
          "hs_task_subject": createTaskSubject,
          "hs_task_status": "NOT_STARTED",
          "hs_task_priority": "HIGH",
          "hs_task_type": "TODO"
        },
        "associations": [
          {
            "to": {
              "id": getSalesDealId
            },
            "types": [
              {
                "associationCategory": "HUBSPOT_DEFINED",
                "associationTypeId": 216
              }
            ]
          }
        ]
      }
    });
    const ApiResponse_4a = await ApiResponse4.json();
    getTaskId = ApiResponse_4a.properties.hs_object_id;
  } catch (err) {
    console.error(err);
    throw err;
  }
  /* 05. UPDATE APPROVAL OBJECT RECORD WITH WELLS */
  try {
      const ApiResponse5 = await hubspotObjects
      .apiRequest({
        method: 'PATCH',
        path: '/crm/v3/objects/2-26103010/' + getApprovalObjectRecordId,
        body: {
          "properties": {
            "approval_hj_task_id": getTaskId
          }
        }
      });
    } catch (err) {
      console.error(err);
      throw err;
    }
  
  /* CREATE LNKS FOR INTERNAL EMAIL NOTIFICATION */
  let createPageLink = "https://hjpetro-1230608.hs-sites.com/hj-field-ticket-for-approval-step-01?project_id=" + getProjectUniqueId + "&approval_request_id=" + getApprovalRequestId + "&customer_email=" + getCustomerContactEmail + "&consultant_id=" + encryptedConsultantId + "&approver_is=" + getWhoIsApprover + "&sales_deal_id=" + getSalesDealId;
  let createPageLinkButton = '<p><a style="font-size: 18px; font-weight: bold; text-transform: uppercase; text-decoration: underline; color: #c20000; margin-top: 16px; margin-bottom: 24px;" href="' + createPageLink + '" rel="nofollow noopener">Approve or Reject The Timesheet</a></p>';
  let setApprover = getWhoIsApprover;

  let createSalesDealLink = 'https://app.hubspot.com/contacts/1230608/record/0-3/' + getSalesDealId;
  let createSalesDealLinkButton = '<p><a style="font-size: 18px; font-weight: bold; text-transform: uppercase; text-decoration: underline; color: #c20000; margin-top: 16px; margin-bottom: 24px;" href="' + createSalesDealLink + '" rel="nofollow noopener">View Deal</a></p>';
  
  /* 06. UPDATE DEAL OWNER CONTACT FOR INTERNAL NOTIFICATION LINKS */
  try {
    const ApiResponse6 = await hubspotContacts
    .apiRequest({
      method: 'PATCH',
      path: '/crm/v3/objects/contacts/' + getContactIdToSendInternalMarketingEmail,
      body: {
        "properties": {
          "approval_internal_page_link": createPageLinkButton,
          "approval_internal_sales_deal_link": createSalesDealLinkButton,
          "approval_approver": setApprover
        }
      }
    });
  } catch (err) {
    console.error(err);
    throw err;
  }
}