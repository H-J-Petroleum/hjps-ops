/* UPDATE APPROVER (CUSTOMER) DETAILS AND WELLS IN APPROVAL OBJECT */
const hubspot = require('@hubspot/api-client');

exports.main = async (event) => {
  
  const hubspotContacts = new hubspot.Client({
    accessToken: process.env.MyContacts
  });
  const hubspotObjects = new hubspot.Client({
    accessToken: process.env.MyCustomObject
  });

  /* 01. GET INFO */
  let getSubmittedAsTimesheetContact;
  let getConsultantId;
  let getConsultantName;
  let getConsultantLastName;
  let getCustomerContactId;
  let getApprovalFromDate;
  let getApprovalUntilDate;
  let getCustomer;
  let getOperator;
  let getLineItemsIds;
  let getApproverEmail;
  let getApprovalRecordId;
  try {
    const ApiResponse1 = await hubspotContacts.crm.contacts.basicApi.getById(event.object.objectId, ["submitted_as_timesheet_contact", "hs_object_id", "main_contact_id", "firstname", "lastname", "main_contact_first_name", "main_contact_last_name", "approver_unique_id", "approval_from_date", "approval_until_date", "approval_customer", "approval_operator", "approval_timesheet_ids_array", "approver_email", "approval_object_record_id"]);
    getSubmittedAsTimesheetContact = ApiResponse1.properties.submitted_as_timesheet_contact;
    if(getSubmittedAsTimesheetContact == 'No'){
      getConsultantId = ApiResponse1.properties.hs_object_id;
      getConsultantName = ApiResponse1.properties.firstname;
      getConsultantLastName = ApiResponse1.properties.lastname;
      getApprovalRecordId = ApiResponse1.properties.approval_object_record_id;
    }else if(getSubmittedAsTimesheetContact == 'Yes'){
      getConsultantId = ApiResponse1.properties.main_contact_id;
      getConsultantName = ApiResponse1.properties.main_contact_first_name;
      getConsultantLastName = ApiResponse1.properties.main_contact_last_name;
    }
    getCustomerContactId = ApiResponse1.properties.approver_unique_id;
    getApprovalFromDate = ApiResponse1.properties.approval_from_date;
    getApprovalUntilDate = ApiResponse1.properties.approval_until_date;
    getCustomer = ApiResponse1.properties.approval_customer;
    getOperator = ApiResponse1.properties.approval_operator;
    getLineItemsIds = ApiResponse1.properties.approval_timesheet_ids_array;
    getApproverEmail = ApiResponse1.properties.approver_email;
  } catch (err) {
    console.error(err);
    throw err;
  }
  
  if(getSubmittedAsTimesheetContact == 'Yes'){
    try {
      const ApiResponse1_2 = await hubspotContacts.crm.contacts.basicApi.getById(getConsultantId, ["approval_object_record_id"]);
      getApprovalRecordId = ApiResponse1_2.properties.approval_object_record_id;
    } catch (err) {
      console.error(err);
      throw err;
    }
  }

  let createLineItemIdsArray = (getLineItemsIds || " ").split(',');
  console.log(createLineItemIdsArray);
  
  /* 02. GET WELL NAMES FROM TIMESHEET OBJECT RECORDS */
  let getWell = [];
  for(let i = 0; i < createLineItemIdsArray.length; i++){
    try {
      const ApiResponse2 = await hubspotObjects
      .apiRequest({
        method: 'GET',
        path: '/crm/v3/objects/2-26173281/' + createLineItemIdsArray[i] + '?properties=timesheet_well'
      });
      const ApiResponse2_a = await ApiResponse2.json();
      getWell.push(ApiResponse2_a.properties.timesheet_well);
    } catch (err) {
      console.error(err);
      throw err;
    }
  }
  let uniqueWellNames = getWell.filter((value, index, array) => array.indexOf(value) === index);
  let uniqueWellNamesString = uniqueWellNames.toString().replaceAll(',', ', ');
  
  /* 03. UPDATE APPROVAL OBJECT RECORD WITH WELLS */
  try {
      const ApiResponse3 = await hubspotObjects
      .apiRequest({
        method: 'PATCH',
        path: '/crm/v3/objects/2-26103010/' + getApprovalRecordId,
        body: {
          "properties": {
            "approval_wells": uniqueWellNamesString,
			"send_approval_consultant_name": getConsultantName + ' ' + getConsultantLastName,
            "send_approval_from_date": getApprovalFromDate,
            "send_approval_until_date": getApprovalUntilDate,
            "send_approval_well_names": uniqueWellNamesString,
            "send_approval_customer": getCustomer,
            "send_approval_operator": getOperator,
            "send_approval_customer_email": getApproverEmail,
          }
        }
      });
    } catch (err) {
      console.error(err);
      throw err;
    }
  
  /* 04. UPDATE APPROVER (CUSTOMER) DETAILS */
  try {
      const ApiResponse4 = await hubspotContacts
      .apiRequest({
        method: 'PATCH',
        path: '/crm/v3/objects/contacts/' + getCustomerContactId,
        body: {
          "properties": {
            "send_approval_consultant_name": getConsultantName + ' ' + getConsultantLastName,
            "send_approval_from_date": getApprovalFromDate,
            "send_approval_until_date": getApprovalUntilDate,
            "send_approval_well_names": uniqueWellNamesString,
            "send_approval_customer": getCustomer,
            "send_approval_operator": getOperator,
            "send_approval_customer_email": getApproverEmail,
          }
        }
      });
    } catch (err) {
      console.error(err);
      throw err;
    }
}