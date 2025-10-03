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
  let getSubmittedAsTimesheetContact;
  let getConsultantId;
  let getTimesheetRecordIds;
  let getApprovalRequestId;
  let getApprovalRecordId;
  let getProcessedDate;
  let getInvoiceBillNumberFirstPart;
  try {
    const ApiResponse1 = await hubspotContacts.crm.contacts.basicApi.getById(event.object.objectId, ["submitted_as_timesheet_contact", "hs_object_id", "main_contact_id", "approval_request_id", "approval_object_record_id", "approval_timesheet_ids_array", "approval_processed_date", "quote_customer_name"]);
    getSubmittedAsTimesheetContact = ApiResponse1.properties.submitted_as_timesheet_contact;
    if(getSubmittedAsTimesheetContact == 'No'){
      getConsultantId = ApiResponse1.properties.hs_object_id;
      getApprovalRequestId = ApiResponse1.properties.approval_request_id;
      getApprovalRecordId = ApiResponse1.properties.approval_object_record_id;
    }else if(getSubmittedAsTimesheetContact == 'Yes'){
      getConsultantId = ApiResponse1.properties.main_contact_id;
    }
    getTimesheetRecordIds = ApiResponse1.properties.approval_timesheet_ids_array;
    getProcessedDate = ApiResponse1.properties.approval_processed_date;
    getInvoiceBillNumberFirstPart = ApiResponse1.properties.quote_customer_name;
  } catch (err) {
    console.error(err);
    throw err;
  }
  if(getSubmittedAsTimesheetContact == 'Yes'){
    try {
      const ApiResponse1_2 = await hubspotContacts.crm.contacts.basicApi.getById(getConsultantId, ["approval_request_id", "approval_object_record_id"]);
      getApprovalRequestId = ApiResponse1_2.properties.approval_request_id;
      getApprovalRecordId = ApiResponse1_2.properties.approval_object_record_id;
    } catch (err) {
      console.error(err);
      throw err;
    }
  }

  /* SET ARRAYS */
  let arrayOfTimesheetIds = getTimesheetRecordIds.split(",").map(Number);
  console.log(arrayOfTimesheetIds);
  
  /* 03. UPDATE TIMESHEETS */
  for(let i = 0; i < arrayOfTimesheetIds.length; i++){
  try {
    const ApiResponse2 = await hubspotObjects
    .apiRequest({
      method: 'PATCH',
      path: '/crm/v3/objects/2-26173281/' + arrayOfTimesheetIds[i],
      body: {
        "properties": {
          "timesheet_approval_status": "Submitted",
          "timesheet_approval_request_id": getApprovalRequestId,
          "approval_object_record_id": getApprovalRecordId,
          "processed_date": getProcessedDate,
          "invoice_number_second_part": getInvoiceBillNumberFirstPart
        }
      }
    });
  } catch (err) {
    console.error(err);
    throw err;
  }
  }
}