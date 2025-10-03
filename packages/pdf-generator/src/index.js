/* eslint-disable no-console */
const path = require('path');
const Module = require('module');

// Ensure modules resolve from config/node_modules when running from src/
try {
  const nm = path.resolve(__dirname, '../../../config/node_modules');
  if (!process.env.NODE_PATH || !process.env.NODE_PATH.includes(nm)) {
    process.env.NODE_PATH = process.env.NODE_PATH ? `${nm}${path.delimiter}${process.env.NODE_PATH}` : nm;
    Module._initPaths();
  }
} catch (_) {
  // best-effort; fall back to default resolution
}

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

// Load env from repo root if available
try {
  const dotenv = require('dotenv');
  // Try common locations
  const candidates = [
    path.resolve(__dirname, '../../../.env.local'),
    path.resolve(__dirname, '../../../.env'),
    path.resolve(process.cwd(), '.env.local'),
    path.resolve(process.cwd(), '.env')
  ];
  for (const file of candidates) {
    const res = dotenv.config({ path: file });
    if (res.parsed) break;
  }
} catch (_) {
  // dotenv optional
}

const logger = require('./utils/logger');
const PDFGenerationFactory = require('./services/pdfGenerationFactory');
const ConfigManager = require('./services/configManager');
const HubSpotService = require('./services/hubspotService');
const ArtifactService = require('./services/artifactService');
const HubSpotFilesService = require('./services/hubspotFilesService');
const { buildFileNameForType } = require('./utils/naming');
const { validateApprovalData } = require('./utils/validation');

const app = express();
const port = process.env.PORT || 3000;

// Initialize services
const configManager = new ConfigManager();
const pdfFactory = new PDFGenerationFactory();

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Rate limiting
const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 100 });
app.use(limiter);

// Services
const hubspotService = new HubSpotService();
const artifactService = new ArtifactService();
const hubspotFilesService = new HubSpotFilesService();

// Serve local files if using local provider
const storageConfig = configManager.getStorageConfig();
if (storageConfig.provider === 'local') {
  const staticDir = require('path').join(process.cwd(), storageConfig.localDir);
  app.use('/files', express.static(staticDir));
}

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Generate PDF endpoint
app.post('/api/pdf/generate', async (req, res) => {
  try {
    const { approvalId } = req.body || {};
    let { pdfType } = req.body || {};
    if (typeof pdfType === 'string') {
      const norm = pdfType.toLowerCase();
      if (norm === 'invoice') pdfType = 'consultant';
    }

    if (!approvalId || !pdfType) {
      return res.status(400).json({
        error: 'Missing required fields: approvalId, pdfType'
      });
    }

    const approvalData = await hubspotService.getApprovalData(approvalId);
    const validationResult = validateApprovalData(approvalData);
    if (!validationResult.isValid) {
      return res.status(400).json({ error: 'Invalid approval data', details: validationResult.errors });
    }

    const props = approvalData.properties || {};
    const timesheetData = await hubspotService.getTimesheetData(
      props.approval_project_id,
      props.approval_request_id,
      props.approval_consultant_id
    );

    const pdfBuffer = await pdfFactory.generatePDF(pdfType, { ...props, timesheetData });

    if (storageConfig.provider === 'hubspot') {
      const pdfTypeConfig = configManager.getPDFTypeConfig(pdfType);
      const requestId = props.approval_request_id || `wf26-${approvalId}`;
      const consultantName = props.approval_consultant_name
        || (Array.isArray(timesheetData) && timesheetData[0]?.timesheet_consultant_full_name)
        || props.approval_project_name
        || 'Consultant';
      const fileName = buildFileNameForType(pdfType, { requestId, consultantName });
      const folderPath = pdfTypeConfig.folderName;
      const { id: fileId, url } = await hubspotFilesService.uploadPDF({ buffer: pdfBuffer, fileName, folderPath });
      await hubspotService.updateApprovalWithFileMeta(approvalId, pdfType, fileId, url);
      return res.json({ success: true, approvalId, pdfType, fileId, url, folderPath, timestamp: new Date().toISOString() });
    }

    // Fallback to external storage (S3/Local) and single URL property
    const { url } = await artifactService.uploadPDF({ buffer: pdfBuffer, approvalId, pdfType });
    await hubspotService.updateApprovalWithPDFUrl(approvalId, url, pdfType);
    return res.json({ success: true, approvalId, pdfType, url, timestamp: new Date().toISOString() });
  } catch (error) {
    logger.error('PDF generation error', { message: error.message });
    return res.status(500).json({ error: 'Internal server error', message: error.message });
  }
});

// Error handling
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  logger.error('Unhandled error', { message: err.message });
  res.status(500).json({ error: 'Internal server error' });
});

if (process.env.NODE_ENV !== 'test') {
  app.listen(port, () => {
    logger.info(`PDF Generator API running on port ${port}`);
  });
}

module.exports = app;
