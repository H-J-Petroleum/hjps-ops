/* CREATE NOTE IN SALES DEAL */
const hubspot = require('@hubspot/api-client');

exports.main = async (event) => {
  
  const hubspotContacts = new hubspot.Client({
    accessToken: process.env.MyContacts
  });
  const hubspotDeals = new hubspot.Client({
    accessToken: process.env.MyDeals
  });

  /* 01. GET INFO */
  let getSubmittedAsTimesheetContact;
  let getConsultantId;
  let getConsultantName;
  let getConsultantLastName;
  let getApprovalFromDate;
  let getApprovalUntilDate;
  let getCustomer;
  let getOperator;
  let getWhoIsApprover;
  let getProjectId;
  let getApprovalRequestId;
  let getSalesDealId;
  let getProjectName;
  let getApproverName;
  let getApproverEmail;
  try {
    const ApiResponse1 = await hubspotContacts.crm.contacts.basicApi.getById(event.object.objectId, ["submitted_as_timesheet_contact", "hs_object_id", "main_contact_id", "firstname", "lastname", "main_contact_first_name", "main_contact_last_name", "approval_request_id", "approval_from_date", "approval_until_date", "approval_customer", "approval_operator", "approver_is", "approval_project_id", "approval_sales_deal_id", "approval_project_name", "approver_full_name", "approver_email"]);
    getSubmittedAsTimesheetContact = ApiResponse1.properties.submitted_as_timesheet_contact;
    if(getSubmittedAsTimesheetContact == 'No'){
      getConsultantId = ApiResponse1.properties.hs_object_id;
      getConsultantName = ApiResponse1.properties.firstname;
      getConsultantLastName = ApiResponse1.properties.lastname;
      getApprovalRequestId = ApiResponse1.properties.approval_request_id;
    }else if(getSubmittedAsTimesheetContact == 'Yes'){
      getConsultantId = ApiResponse1.properties.main_contact_id;
      getConsultantName = ApiResponse1.properties.main_contact_first_name;
      getConsultantLastName = ApiResponse1.properties.main_contact_last_name;
    }
    getApprovalFromDate = ApiResponse1.properties.approval_from_date;
    getApprovalUntilDate = ApiResponse1.properties.approval_until_date;
    getCustomer = ApiResponse1.properties.approval_customer;
    getOperator = ApiResponse1.properties.approval_operator;
    getWhoIsApprover = ApiResponse1.properties.approver_is;
    getProjectId = ApiResponse1.properties.approval_project_id;
    getSalesDealId = ApiResponse1.properties.approval_sales_deal_id;
    getProjectName = ApiResponse1.properties.approval_project_name;
    getApproverName = ApiResponse1.properties.approver_full_name;
    getApproverEmail = ApiResponse1.properties.approver_email;
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

  let setDateTimeNow = new Date().getTime();
//   console.log(setDateTimeNow, "setDateTimeNow");
//   console.log(getSalesDealId, "deal id")
  /* 02. GET SALES DEAL OWNER ID */
  let getSalesDealOwnerId;
  try {
    const ApiResponse2 = await hubspotDeals
    .apiRequest({
      method: 'GET',
      path: '/crm/v3/objects/deals/' + getSalesDealId + '?properties=hubspot_owner_id'
    });
    const ApiResponse2_a = await ApiResponse2.json();
    getSalesDealOwnerId = ApiResponse2_a.properties.hubspot_owner_id;
  } catch (err) {
    console.error(err);
    throw err;
  }
  console.log("Sales Deal Owner Id: " + getSalesDealOwnerId);
  
  /* PREPARE NOTE BODY */
  let setApproverForNote;
  if(getWhoIsApprover == 'Primary Contact'){
    setApproverForNote = 'Customer’s Primary Contact';
  } else if(getWhoIsApprover == 'HJPetro'){
    setApproverForNote = 'H&J Petroleum'
  }else if(getWhoIsApprover == 'Not HJPetro'){
    setApproverForNote = getApproverName + ' (' + getApproverEmail + ')';
  }
  let createNoteLink = 'https://hjpetro-1230608.hs-sites.com/consultant-requested-line-items-approval-01?project_id=' + getProjectId + '&approval_request_id=' + getApprovalRequestId + '&approver_is=' + getWhoIsApprover;
  let createNoteBody = '<div style="" dir="auto" data-top-level="true"><p style="margin:0;"><strong><span style="color: rgb(194, 0, 0);">' + getConsultantName + ' ' + getConsultantLastName + ' has submitted Approval Request</span></strong></p><br><ul><li style="color: rgb(51, 51, 51);"><p style="margin:0;"><span style="color: rgb(51, 51, 51);">Time Period: </span><strong><span style="color: rgb(51, 51, 51);">' + getApprovalFromDate + ' - ' + getApprovalUntilDate + '</span></strong></p></li><li style="color: rgb(51, 51, 51);"><p style="margin:0;"><span style="color: rgb(51, 51, 51);">Project/Sales Deal: </span><strong>' + getProjectName + '</strong></p></li><li><p style="margin:0;">Customer: <strong>' + getCustomer + '</strong></p></li><li style="color: rgb(51, 51, 51);"><p style="margin:0;"><span style="color: rgb(51, 51, 51);">Operator: </span><strong><span style="color: rgb(51, 51, 51);"> </span>' + getOperator + '</strong></p></li><li style="color: rgb(51, 51, 51);"><p style="margin:0;"><span style="color: rgb(51, 51, 51);">Approver: </span><strong><span style="color: rgb(51, 51, 51);"> </span>' + setApproverForNote + '</strong></p></li></ul><br><p style="margin:0;"><span style="color: rgb(51, 51, 51);"><span style="font-size: 11pt;">If you want to know more, click on the link below</span></span></p><br><p style="margin:0;"><a href="' + createNoteLink + '" title="VIEW APPROVAL REQUEST" target="_blank">VIEW APPROVAL REQUEST</a></p></div>';
  
  /* 03. CREATE AND ASSOCIATE NOTE */
  let getNoteId;
  try {
    const ApiResponse3 = await hubspotContacts
    .apiRequest({
      method: 'POST',
      path: '/crm/v3/objects/notes',
      body: {
        "properties": {
          "hs_timestamp": setDateTimeNow,
          "hs_note_body": createNoteBody,
          "hubspot_owner_id": getSalesDealOwnerId
        },
        "associations": [
          {
            "to": {
              "id": getSalesDealId
            },
            "types": [
              {
                "associationCategory": "HUBSPOT_DEFINED",
                "associationTypeId": 214
              }
            ]
          }
        ]
      }
    });
    const ApiResponse_3a = await ApiResponse3.json();
    getNoteId = ApiResponse_3a.properties.hs_object_id;
  } catch (err) {
    console.error(err);
    throw err;
  }
}