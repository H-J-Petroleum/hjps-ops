const FormData = require('form-data');

function readPdfBuffer(properties, prefix) {
  if (!properties) {
    return null;
  }

  const chunks = [];
  for (let index = 1; index <= 5; index += 1) {
    const key = `${prefix}_pdf___0${index}`;
    const value = properties[key];
    if (typeof value === 'string' && value.trim().length > 0) {
      chunks.push(value.trim());
    }
  }

  if (chunks.length === 0) {
    return null;
  }

  try {
    return Buffer.from(chunks.join(''), 'base64');
  } catch (error) {
    return null;
  }
}

function sanitiseSegment(input, fallback) {
  const value = (input || fallback || '').toString().trim();
  if (!value) {
    return 'document';
  }
  return value
    .replace(/[^a-zA-Z0-9-_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    || 'document';
}

async function uploadDocument({ httpClient, buffer, fileName, folderPath }) {
  const form = new FormData();
  form.append('file', buffer, { filename: fileName, contentType: 'application/pdf' });
  form.append('fileName', fileName);
  form.append('folderPath', folderPath);
  form.append('options', JSON.stringify({ access: 'PUBLIC_NOT_INDEXABLE', overwrite: false }));

  const headers = Object.assign({}, form.getHeaders());

  const response = await httpClient.post('/files/v3/files', form, {
    headers,
    maxContentLength: Infinity,
    maxBodyLength: Infinity,
  });

  const data = response?.data || {};
  return {
    id: data.id || data.fileId || null,
    url: data.url || data.friendlyUrl || null,
  };
}

async function patchApproval({ httpClient, approvalObjectId, approvalId, properties }) {
  await httpClient.patch(`/crm/v3/objects/${approvalObjectId}/${approvalId}`, {
    properties,
  });
}

async function processDocuments({ context, logger }) {
  const approvalProps = context.approval?.properties || {};
  const httpClient = context.httpClient;
  const approvalId = context.approvalId;
  const approvalObjectId = context.objectIds?.approval
    || process.env.HJ_APPROVAL_OBJECT_ID
    || '2-26103010';

  logger.debug('processDocuments invoked', {
    approvalId,
  });

  const requestId = sanitiseSegment(
    approvalProps.response_approval_request_id,
    `wf26-${approvalId}`,
  );

  const consultantNameSegment = sanitiseSegment(
    approvalProps.response_approval_consultant_name
      || approvalProps.approval_consultant_name
      || approvalProps.approval_project_name,
    'Consultant',
  );

  const fieldTicketBuffer = readPdfBuffer(approvalProps, 'field_ticket');
  const consultantTicketBuffer = readPdfBuffer(approvalProps, 'consultant_field_ticket');

  const documents = {};

  if (!httpClient) {
    logger.warn('No httpClient available – skipping document upload', { approvalId });
    context.documents = documents;
    return documents;
  }

  if (fieldTicketBuffer && fieldTicketBuffer.length > 0) {
    const fileName = `Approved-Field-Ticket-${consultantNameSegment}-${requestId}.pdf`;
    const folderPath = 'ApprovedFieldTickets';

    const upload = await uploadDocument({
      httpClient,
      buffer: fieldTicketBuffer,
      fileName,
      folderPath,
    });

    if (upload.id && upload.url) {
      await patchApproval({
        httpClient,
        approvalObjectId,
        approvalId,
        properties: {
          field_ticket_id: upload.id,
          field_ticket_url: upload.url,
        },
      });

      approvalProps.field_ticket_id = upload.id;
      approvalProps.field_ticket_url = upload.url;

      documents.fieldTicket = {
        fileName,
        folderPath,
        fileId: upload.id,
        fileUrl: upload.url,
      };

      logger.info('Field ticket uploaded', {
        approvalId,
        fileId: upload.id,
      });
    } else {
      logger.warn('Field ticket upload did not return file metadata', {
        approvalId,
        fileName,
      });
    }
  } else {
    logger.debug('No field ticket PDF data found', { approvalId });
  }

  if (consultantTicketBuffer && consultantTicketBuffer.length > 0) {
    const fileName = `Approved-Timesheet-${requestId}.pdf`;
    const folderPath = 'BillForConsultants';

    const upload = await uploadDocument({
      httpClient,
      buffer: consultantTicketBuffer,
      fileName,
      folderPath,
    });

    if (upload.id && upload.url) {
      await patchApproval({
        httpClient,
        approvalObjectId,
        approvalId,
        properties: {
          consultant_field_ticket_id: upload.id,
          consultant_field_ticket_url: upload.url,
        },
      });

      approvalProps.consultant_field_ticket_id = upload.id;
      approvalProps.consultant_field_ticket_url = upload.url;

      documents.consultantTicket = {
        fileName,
        folderPath,
        fileId: upload.id,
        fileUrl: upload.url,
      };

      logger.info('Consultant ticket uploaded', {
        approvalId,
        fileId: upload.id,
      });
    } else {
      logger.warn('Consultant ticket upload did not return file metadata', {
        approvalId,
        fileName,
      });
    }
  } else {
    logger.debug('No consultant ticket PDF data found', { approvalId });
  }

  context.documents = documents;
  return documents;
}

module.exports = {
  processDocuments,
};
