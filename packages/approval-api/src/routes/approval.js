/**
 * Approval Routes
 * Main approval workflow endpoints
 */

const express = require('express');
const router = express.Router();
const logger = require('../utils/logger');

// Import services
const ApprovalService = require('../services/approvalService');
const UrlResolverService = require('../services/urlResolverService');

/**
 * Process approval workflow
 * POST /api/approval/process
 */
router.post('/process', async (req, res) => {
  try {
    const { approvalUrl, approvalId, pdfType = 'customer', decision = 'Approve', comments = 'Approved via API' } = req.body;

    logger.info('Approval process requested', {
      approvalUrl,
      approvalId,
      pdfType,
      decision,
      requestId: req.id
    });

    // Validate required parameters
    if (!approvalUrl && !approvalId) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Either approvalUrl or approvalId is required'
        },
        timestamp: new Date().toISOString(),
        requestId: req.id
      });
    }

    const approvalService = new ApprovalService();
    const result = await approvalService.processApproval({
      approvalUrl,
      approvalId,
      pdfType,
      decision,
      comments
    });

    res.json({
      success: true,
      data: result,
      timestamp: new Date().toISOString(),
      requestId: req.id
    });

  } catch (error) {
    logger.error('Approval process failed', {
      error: error.message,
      requestId: req.id
    });

    res.status(500).json({
      success: false,
      error: {
        message: 'Approval process failed',
        details: error.message
      },
      timestamp: new Date().toISOString(),
      requestId: req.id
    });
  }
});

/**
 * Get approval status
 * GET /api/approval/status/:id
 */
router.get('/status/:id', async (req, res) => {
  try {
    const { id } = req.params;

    logger.info('Approval status requested', {
      approvalId: id,
      requestId: req.id
    });

    const approvalService = new ApprovalService();
    const status = await approvalService.getApprovalStatus(id);

    res.json({
      success: true,
      data: status,
      timestamp: new Date().toISOString(),
      requestId: req.id
    });

  } catch (error) {
    logger.error('Status check failed', {
      error: error.message,
      approvalId: req.params.id,
      requestId: req.id
    });

    res.status(500).json({
      success: false,
      error: {
        message: 'Status check failed',
        details: error.message
      },
      timestamp: new Date().toISOString(),
      requestId: req.id
    });
  }
});

/**
 * Retry failed approval
 * POST /api/approval/retry/:id
 */
router.post('/retry/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { pdfType = 'customer', decision = 'Approve', comments = 'Retried via API' } = req.body;

    logger.info('Approval retry requested', {
      approvalId: id,
      pdfType,
      decision,
      requestId: req.id
    });

    const approvalService = new ApprovalService();
    const result = await approvalService.retryApproval(id, {
      pdfType,
      decision,
      comments
    });

    res.json({
      success: true,
      data: result,
      timestamp: new Date().toISOString(),
      requestId: req.id
    });

  } catch (error) {
    logger.error('Approval retry failed', {
      error: error.message,
      approvalId: req.params.id,
      requestId: req.id
    });

    res.status(500).json({
      success: false,
      error: {
        message: 'Approval retry failed',
        details: error.message
      },
      timestamp: new Date().toISOString(),
      requestId: req.id
    });
  }
});

/**
 * Parse approval URL
 * POST /api/approval/parse-url
 */
router.post('/parse-url', async (req, res) => {
  try {
    const { approvalUrl } = req.body;

    if (!approvalUrl) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'approvalUrl is required'
        },
        timestamp: new Date().toISOString(),
        requestId: req.id
      });
    }

    logger.info('URL parsing requested', {
      approvalUrl,
      requestId: req.id
    });

    const urlResolver = new UrlResolverService();
    const context = await urlResolver.resolveContext({ approvalUrl });
    const validation = urlResolver.validateContext(context);

    res.json({
      success: true,
      data: {
        approvalUrl,
        context: urlResolver.sanitizeContext ? urlResolver.sanitizeContext(context) : context,
        validation
      },
      timestamp: new Date().toISOString(),
      requestId: req.id
    });

  } catch (error) {
    logger.error('URL parsing failed', {
      error: error.message,
      requestId: req.id
    });

    res.status(500).json({
      success: false,
      error: {
        message: 'URL parsing failed',
        details: error.message
      },
      timestamp: new Date().toISOString(),
      requestId: req.id
    });
  }
});

/**
 * Send approval request email
 * POST /api/approval/send-request-email
 */
router.post('/send-request-email', async (req, res) => {
  try {
    const { approvalId, projectId, consultantId, approverId, approverType, approverEmail } = req.body;

    logger.info('Approval request email requested', {
      approvalId,
      projectId,
      consultantId,
      approverId,
      approverType,
      requestId: req.id
    });

    // Validate required parameters
    if (!approvalId || !projectId || !consultantId || !approverId || !approverType) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'approvalId, projectId, consultantId, approverId, and approverType are required'
        },
        timestamp: new Date().toISOString(),
        requestId: req.id
      });
    }

    const approvalService = new ApprovalService();
    const context = {
      approvalRequestId: approvalId,
      projectId,
      consultantId,
      approverId,
      approverType,
      approverEmail
    };

    const result = await approvalService.sendApprovalRequestEmail(context);

    res.json({
      success: true,
      data: result,
      timestamp: new Date().toISOString(),
      requestId: req.id
    });

  } catch (error) {
    logger.error('Approval request email failed', {
      error: error.message,
      requestId: req.id
    });

    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to send approval request email',
        details: error.message
      },
      timestamp: new Date().toISOString(),
      requestId: req.id
    });
  }
});

/**
 * Send reminder email
 * POST /api/approval/send-reminder-email
 */
router.post('/send-reminder-email', async (req, res) => {
  try {
    const { approvalId, projectId, consultantId, approverId, approverType, approverEmail, reminderType = 'FirstReminder' } = req.body;

    logger.info('Reminder email requested', {
      approvalId,
      projectId,
      consultantId,
      approverId,
      approverType,
      reminderType,
      requestId: req.id
    });

    // Validate required parameters
    if (!approvalId || !projectId || !consultantId || !approverId || !approverType) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'approvalId, projectId, consultantId, approverId, and approverType are required'
        },
        timestamp: new Date().toISOString(),
        requestId: req.id
      });
    }

    const approvalService = new ApprovalService();
    const context = {
      approvalRequestId: approvalId,
      projectId,
      consultantId,
      approverId,
      approverType,
      approverEmail
    };

    const result = await approvalService.sendReminderEmail(context, reminderType);

    res.json({
      success: true,
      data: result,
      timestamp: new Date().toISOString(),
      requestId: req.id
    });

  } catch (error) {
    logger.error('Reminder email failed', {
      error: error.message,
      requestId: req.id
    });

    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to send reminder email',
        details: error.message
      },
      timestamp: new Date().toISOString(),
      requestId: req.id
    });
  }
});

/**
 * Send approval notifications (response emails)
 * POST /api/approval/send-notifications
 */
router.post('/send-notifications', async (req, res) => {
  try {
    const { approvalId, projectId, consultantId, approverType, approverEmail, decision, comments, pdfResult } = req.body;

    logger.info('Approval notifications requested', {
      approvalId,
      projectId,
      consultantId,
      approverType,
      decision,
      requestId: req.id
    });

    // Validate required parameters
    if (!approvalId || !projectId || !consultantId || !approverType || !decision) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'approvalId, projectId, consultantId, approverType, and decision are required'
        },
        timestamp: new Date().toISOString(),
        requestId: req.id
      });
    }

    const approvalService = new ApprovalService();
    const context = {
      approvalRequestId: approvalId,
      projectId,
      consultantId,
      approverType,
      approverEmail
    };

    const results = {
      decision,
      comments,
      pdfResult
    };

    const result = await approvalService.sendApprovalNotifications(context, results);

    res.json({
      success: true,
      data: result,
      timestamp: new Date().toISOString(),
      requestId: req.id
    });

  } catch (error) {
    logger.error('Approval notifications failed', {
      error: error.message,
      requestId: req.id
    });

    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to send approval notifications',
        details: error.message
      },
      timestamp: new Date().toISOString(),
      requestId: req.id
    });
  }
});

/**
 * POST /api/approval/generate-wf26-pdfs
 * Generate Field Ticket PDFs using WF-26 Actions 6 & 7 logic
 * Uses the existing PDF generator service for professional PDF generation
 */
router.post('/generate-wf26-pdfs', async (req, res) => {
  try {
    const { approvalId, generateCustomer = true, generateConsultant = true } = req.body;

    logger.info('WF-26 PDF generation request received', {
      approvalId,
      generateCustomer,
      generateConsultant,
      requestId: req.id
    });

    // Validate required fields
    if (!approvalId) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Missing required field: approvalId'
        },
        timestamp: new Date().toISOString(),
        requestId: req.id
      });
    }

    const options = {
      generateCustomer,
      generateConsultant
    };

    const approvalService = new ApprovalService();
    const result = await approvalService.generateWF26FieldTickets(approvalId, options);

    res.json({
      success: true,
      data: result,
      timestamp: new Date().toISOString(),
      requestId: req.id
    });

  } catch (error) {
    logger.error('WF-26 PDF generation failed', {
      error: error.message,
      requestId: req.id
    });

    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to generate WF-26 Field Ticket PDFs',
        details: error.message
      },
      timestamp: new Date().toISOString(),
      requestId: req.id
    });
  }
});

/**
 * POST /api/approval/generate-wf26-numbers
 * Generate Invoice and Bill Numbers using WF-26 Actions 4 & 5 logic
 * Creates invoice and bill numbers with format: [SEQUENTIAL_COUNTER]-[CUSTOMER_ID]-[FROM_DATE]-[UNTIL_DATE]
 */
router.post('/generate-wf26-numbers', async (req, res) => {
  try {
    const { approvalId, generateInvoice = true, generateBill = true } = req.body;

    logger.info('WF-26 Invoice/Bill Number generation request received', {
      approvalId,
      generateInvoice,
      generateBill,
      requestId: req.id
    });

    // Validate required fields
    if (!approvalId) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Missing required field: approvalId'
        },
        timestamp: new Date().toISOString(),
        requestId: req.id
      });
    }

    const options = {
      generateInvoice,
      generateBill
    };

    const approvalService = new ApprovalService();
    const result = await approvalService.generateWF26InvoiceBillNumbers(approvalId, options);

    res.json({
      success: true,
      data: result,
      timestamp: new Date().toISOString(),
      requestId: req.id
    });

  } catch (error) {
    logger.error('WF-26 Invoice/Bill Number generation failed', {
      error: error.message,
      requestId: req.id
    });

    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to generate WF-26 Invoice and Bill Numbers',
        details: error.message
      },
      timestamp: new Date().toISOString(),
      requestId: req.id
    });
  }
});

module.exports = router;
