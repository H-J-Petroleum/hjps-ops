const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

const { validateContext } = require('../lib/validation');
const { buildBillingPayloads } = require('../lib/billing');
const { processDocuments } = require('../lib/documents');
const { applyStatusUpdates } = require('../lib/updates');

function loadFixture() {
  const fixturePath = path.resolve(__dirname, 'fixtures', 'approval-35141636865-context.json');
  const raw = fs.readFileSync(fixturePath, 'utf-8');
  return JSON.parse(raw);
}

function createLogger() {
  const entries = [];
  const push = (level, message, meta) => {
    entries.push({ level, message, meta: meta || {} });
  };
  return {
    entries,
    debug: (message, meta) => push('debug', message, meta),
    info: (message, meta) => push('info', message, meta),
    warn: (message, meta) => push('warn', message, meta),
    error: (message, meta) => push('error', message, meta),
  };
}

function cloneContext(context) {
  if (typeof structuredClone === 'function') {
    return structuredClone(context);
  }
  return JSON.parse(JSON.stringify(context));
}

function createHttpClientStub() {
  const calls = {
    post: [],
    patch: [],
  };

  const client = {
    post: async (url, data, config) => {
      calls.post.push({ url, data, config });
      if (url.startsWith('/files/v3/files')) {
        const uploadIndex = calls.post.filter((entry) => entry.url.startsWith('/files/v3/files')).length;
        return {
          data: {
            id: `file-${uploadIndex}`,
            url: `https://files.example.com/${uploadIndex}.pdf`,
          },
        };
      }
      return { data: {} };
    },
    patch: async (url, data) => {
      calls.patch.push({ url, data });
      return { data: {} };
    },
  };

  return { client, calls };
}

test('sandbox approval fixture contains expected structure', () => {
  const context = loadFixture();
  assert.equal(context.approvalId, '35141636865');
  assert.ok(Array.isArray(context.timesheets));
  assert.equal(context.timesheets.length, 2);
  assert.equal(context.project.properties.hj_project_id, 'hjp-sandbox-202509232331-c4a9');
  assert.equal(context.timesheets[0].properties.timesheet_start_date, '2025-09-23');
});

test('validateContext accepts seeded sandbox context', async () => {
  const context = cloneContext(loadFixture());
  const logger = createLogger();
  await validateContext({ context, logger });
  const debugEntry = logger.entries.find((entry) => entry.message === 'Context validation passed');
  assert.ok(debugEntry, 'expected validation to log success');
  assert.equal(debugEntry.meta.timesheetCount, 2);
});

test('applyStatusUpdates patches approval and timesheets', async () => {
  const context = cloneContext(loadFixture());
  const logger = createLogger();
  const { client, calls } = createHttpClientStub();
  context.httpClient = client;

  await applyStatusUpdates({ context, logger });

  const today = new Date().toISOString().slice(0, 10);

  const approvalPatch = calls.patch.find((entry) => entry.url.startsWith('/crm/v3/objects/2-50490319/'));
  assert.ok(approvalPatch, 'expected approval patch call');
  assert.equal(approvalPatch.data.properties.approval_approval_status, 'Approved');
  assert.equal(approvalPatch.data.properties.approval_processed_date, today);

  const timesheetBatch = calls.post.find((entry) => entry.url.startsWith('/crm/v3/objects/2-50490321/batch/update'));
  assert.ok(timesheetBatch, 'expected timesheet batch update');
  assert.equal(timesheetBatch.data.inputs.length, 2);
  assert.equal(timesheetBatch.data.inputs[0].properties.timesheet_approval_status, 'Approved');
  assert.equal(timesheetBatch.data.inputs[0].properties.processed_date, today);

  assert.equal(context.approval.properties.approval_approval_status, 'Approved');
  assert.equal(context.approval.properties.approval_processed_date, today);
  assert.equal(context.timesheets[0].properties.timesheet_approval_status, 'Approved');
  assert.equal(context.timesheets[0].properties.processed_date, today);
  assert.equal(context.timesheets[0].properties.timesheet_approval_comment, 'Seeded via sandbox-seed-approval.js');
});

test('buildBillingPayloads applies invoice and bill numbers', async () => {
  const context = cloneContext(loadFixture());
  const logger = createLogger();
  const { client, calls } = createHttpClientStub();
  context.httpClient = client;

  const result = await buildBillingPayloads({ context, logger });

  assert.equal(result.invoiceNumber, '0701-0922-0923');
  assert.equal(result.billNumber, '0701-0922-0923');

  const batchCall = calls.post.find((entry) => entry.url.startsWith('/crm/v3/objects/2-50490321/batch/update'));
  assert.ok(batchCall, 'expected batch update call');
  assert.equal(batchCall.data.inputs.length, 2);
  assert.equal(batchCall.data.inputs[0].properties.invoice_number, '0701-0922-0923');

  assert.equal(context.timesheets[0].properties.invoice_number, '0701-0922-0923');
  assert.equal(context.timesheets[0].properties.bill_number, '0701-0922-0923');
});

test('processDocuments uploads field and consultant tickets', async () => {
  const context = cloneContext(loadFixture());
  const logger = createLogger();
  const { client, calls } = createHttpClientStub();
  context.httpClient = client;
  context.objectIds = context.objectIds || {
    approval: '2-50490319',
  };

  const documents = await processDocuments({ context, logger });

  const uploadCalls = calls.post.filter((entry) => entry.url.startsWith('/files/v3/files'));
  assert.equal(uploadCalls.length, 2, 'expected two upload calls');

  const patchCalls = calls.patch.filter((entry) => entry.url.startsWith('/crm/v3/objects/2-50490319/35141636865'));
  assert.equal(patchCalls.length, 2, 'expected two approval patch calls');

  assert.ok(documents.fieldTicket);
  assert.ok(documents.consultantTicket);
  assert.match(documents.fieldTicket.fileName, /^Approved-Field-Ticket-/);
  assert.equal(documents.fieldTicket.folderPath, 'ApprovedFieldTickets');
  assert.equal(documents.consultantTicket.folderPath, 'BillForConsultants');
  assert.equal(documents.fieldTicket.fileUrl, 'https://files.example.com/1.pdf');
  assert.equal(documents.consultantTicket.fileUrl, 'https://files.example.com/2.pdf');
});
