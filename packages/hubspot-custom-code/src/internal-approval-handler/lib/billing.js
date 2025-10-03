function parseDate(value) {
  if (!value) {
    return null;
  }

  if (typeof value !== 'string') {
    return null;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  if (/^\d{2}\/\d{2}\/\d{4}$/.test(trimmed)) {
    const [month, day, year] = trimmed.split('/');
    const isoLike = `${year}-${month}-${day}`;
    const parsed = new Date(isoLike + 'T00:00:00Z');
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  const parsed = new Date(trimmed);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function normaliseDateSegment(date) {
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  return month + day;
}

function deriveDateRange(context) {
  const approvalProps = context.approval?.properties || {};

  let fromDate = parseDate(approvalProps.response_approval_from_date);
  let untilDate = parseDate(approvalProps.response_approval_until_date);

  const parsedTimesheetDates = (context.timesheets || [])
    .flatMap((record) => {
      const props = record.properties || {};
      return [
        parseDate(props.timesheet_date),
        parseDate(props.timesheet_start_date),
        parseDate(props.timesheet_end_date),
      ];
    })
    .filter((dt) => dt instanceof Date);

  if (!fromDate && parsedTimesheetDates.length > 0) {
    fromDate = parsedTimesheetDates.reduce((min, current) => (current < min ? current : min));
  }

  if (!untilDate && parsedTimesheetDates.length > 0) {
    untilDate = parsedTimesheetDates.reduce((max, current) => (current > max ? current : max));
  }

  if (!fromDate || !untilDate) {
    return null;
  }

  return { fromDate, untilDate };
}

function determineInvoicePrefix(context) {
  const approvalProps = context.approval?.properties || {};
  const projectProps = context.project?.properties || {};

  const candidates = [
    approvalProps.quote_customer_primary_contact_id,
    approvalProps.response_approval_customer_id,
    projectProps.hj_customer_id,
    approvalProps.approval_project_id,
    context.approvalId,
  ];

  const prefix = candidates.find((value) => typeof value === 'string' && value.trim().length > 0);
  return prefix ? prefix.trim() : null;
}

async function applyBillingNumbers({ context, logger, invoiceNumber, billNumber }) {
  const timesheetObjectId = context.objectIds?.timesheet
    || process.env.HJ_TIMESHEET_OBJECT_ID
    || '2-26173281';

  const inputs = (context.timesheets || []).map((record) => ({
    id: record.id,
    properties: {
      invoice_number: invoiceNumber,
      bill_number: billNumber,
    },
  }));

  if (inputs.length === 0) {
    logger.debug('No timesheets to update with billing numbers', {
      approvalId: context.approvalId,
    });
    return;
  }

  const alreadyUpToDate = (context.timesheets || []).every((record) => {
    const current = record.properties || {};
    return current.invoice_number === invoiceNumber && current.bill_number === billNumber;
  });

  if (alreadyUpToDate) {
    logger.info('Billing numbers already applied', {
      approvalId: context.approvalId,
      invoiceNumber,
      count: inputs.length,
    });
    return;
  }

  if (!context.httpClient) {
    logger.warn('No httpClient available to persist billing numbers', {
      approvalId: context.approvalId,
    });
    return;
  }

  await context.httpClient.post(`/crm/v3/objects/${timesheetObjectId}/batch/update`, {
    inputs,
  });

  context.timesheets = (context.timesheets || []).map((record) => ({
    id: record.id,
    properties: Object.assign({}, record.properties, {
      invoice_number: invoiceNumber,
      bill_number: billNumber,
    }),
  }));

  logger.info('Billing numbers applied', {
    approvalId: context.approvalId,
    invoiceNumber,
    timesheetCount: inputs.length,
  });
}

/**
 * Builds invoice and bill identifiers and applies them to timesheets.
 * @param {object} params
 * @param {object} params.context
 * @param {object} params.logger
 */
async function buildBillingPayloads({ context, logger }) {
  const prefix = determineInvoicePrefix(context);

  if (!prefix) {
    logger.warn('Unable to build billing numbers, prefix missing', {
      approvalId: context.approvalId,
    });
    return null;
  }

  const dateRange = deriveDateRange(context);
  if (!dateRange) {
    logger.warn('Unable to build billing numbers, date range missing', {
      approvalId: context.approvalId,
    });
    return null;
  }

  const fromSegment = normaliseDateSegment(dateRange.fromDate);
  const untilSegment = normaliseDateSegment(dateRange.untilDate);

  const invoiceNumber = `${prefix}-${fromSegment}-${untilSegment}`;
  const billNumber = invoiceNumber;

  await applyBillingNumbers({ context, logger, invoiceNumber, billNumber });

  return {
    invoiceNumber,
    billNumber,
  };
}

module.exports = {
  buildBillingPayloads,
};
