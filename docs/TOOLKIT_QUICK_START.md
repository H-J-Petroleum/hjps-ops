# Toolkit Quick Start Guide

**Repository:** hjps-ops
**Last Updated:** 2025-10-03

## Overview

This guide helps you get started using the `@hjps/toolkit-*` packages in the hjps-ops repository. The toolkit provides shared components for HubSpot integration, PDF generation, and configuration management.

## Prerequisites

1. **Node.js** >= 18.0.0
2. **npm** >= 8.0.0
3. **hjps-toolkit** repository cloned locally

## Repository Layout

```
D:\code\
├── hjps-toolkit/           ← Toolkit packages repository
│   └── packages/
│       ├── toolkit-hubspot/
│       ├── toolkit-pdf/
│       ├── toolkit-config/
│       └── toolkit-cli/
└── hjps-ops/              ← This repository
    └── packages/
        ├── approval-api/
        ├── pdf-generator/
        └── hubspot-custom-code/
```

## Installation

### Step 1: Clone hjps-toolkit (if not already done)

```bash
cd D:\code
git clone https://github.com/H-J-Petroleum/hjps-toolkit.git
cd hjps-toolkit
npm install
```

### Step 2: Install hjps-ops Dependencies

```bash
cd D:\code\hjps-ops
npm install

# Install workspace dependencies
npm install --workspaces
```

This will automatically link the toolkit packages using the `file:` protocol specified in `package.json`.

### Step 3: Verify Installation

```bash
# Check if toolkit packages are linked correctly
ls -la packages/approval-api/node_modules/@hjps/

# Should show symlinks to:
# - toolkit-hubspot -> ../../../hjps-toolkit/packages/toolkit-hubspot
# - toolkit-pdf -> ../../../hjps-toolkit/packages/toolkit-pdf
```

## Using Toolkit Packages

### Example 1: HubSpot Client in approval-api

**Before (Legacy):**
```javascript
// packages/approval-api/src/services/approvalService.js
const HubspotService = require('./hubspotService');
const hubspot = new HubspotService();

const context = await hubspot.pullRelatedRecords({
  approvalRequestId: 'AR-12345'
});
```

**After (Toolkit):**
```javascript
// packages/approval-api/src/services/approvalService.js
const { HubSpotClient } = require('@hjps/toolkit-hubspot');

const hubspot = new HubSpotClient({
  environment: process.env.HUBSPOT_ENV || 'production',
  token: process.env.PRIVATE_APP_TOKEN
});

// Use toolkit methods
const approval = await hubspot.getObject('approval', 'AR-12345');
const timesheets = await hubspot.getObjectBatch('timesheet', timesheetIds);
```

### Example 2: PDF Client in approval-api

**Before (Legacy):**
```javascript
// packages/approval-api/src/services/wf26PdfGenerationService.js
const axios = require('axios');
const pdfClient = axios.create({
  baseURL: process.env.PDF_SERVICE_URL
});

const response = await pdfClient.post('/generate', payload);
```

**After (Toolkit):**
```javascript
// packages/approval-api/src/services/wf26PdfGenerationService.js
const { PDFClient } = require('@hjps/toolkit-pdf');
const { ValueFormattingService } = require('@hjps/toolkit-pdf/formatting');

const pdfClient = new PDFClient({
  baseURL: process.env.PDF_SERVICE_URL,
  timeout: 30000
});

const formatter = new ValueFormattingService();
const normalizedQuantity = formatter.normalizeQuantity(rawQuantity);

const pdfUrl = await pdfClient.generateApprovalPDF(context);
```

### Example 3: Environment Validation

```javascript
// packages/approval-api/src/config/hubspot.js
const { validateEnvironment } = require('@hjps/toolkit-hubspot/validation');

async function loadHubSpotConfig() {
  const validation = await validateEnvironment(
    process.env.HUBSPOT_ENV || 'production'
  );

  if (!validation.valid) {
    console.error('Environment validation failed:', validation.errors);
    throw new Error('Invalid HubSpot configuration');
  }

  return validation.config;
}

module.exports = { loadHubSpotConfig };
```

## Environment Configuration

### Required Environment Variables

Create a `.env` file in the repository root:

```bash
# HubSpot Configuration
HUBSPOT_ENV=production                    # or: legacySandbox, betaSandbox
PRIVATE_APP_TOKEN=pat-na1-xxxxxxxx       # HubSpot private app token
BEARER_TOKEN=pat-na1-xxxxxxxx            # Alias for PRIVATE_APP_TOKEN

# PDF Service
PDF_SERVICE_URL=http://localhost:8080    # PDF generator service URL
PDF_SERVICE_TIMEOUT=30000                # PDF request timeout (ms)

# API Service
PORT=3001                                # Approval API port
NODE_ENV=development                     # development | production | test
ALLOWED_ORIGINS=http://localhost:3000    # CORS allowed origins

# Logging
LOG_LEVEL=info                          # error | warn | info | debug
TEAMS_WEBHOOK_URL=                      # Optional: MS Teams webhook
```

### Environment-Specific Configs

The toolkit supports three HubSpot environments:

| Environment | Portal ID | Description |
|-------------|-----------|-------------|
| `production` | 1230608 | Production portal |
| `legacySandbox` | (legacy) | Legacy sandbox (if exists) |
| `betaSandbox` | (beta) | Beta sandbox environment |

Configuration is managed via `@hjps/toolkit-hubspot/config/environments.yml`.

## Development Workflow

### Running Services Locally

```bash
# Start approval-api in development mode
npm run --workspace packages/approval-api dev

# Start with specific environment
HUBSPOT_ENV=betaSandbox npm run --workspace packages/approval-api dev
```

### Testing with Toolkit

```bash
# Run all tests
npm test

# Run tests for specific package
npm run --workspace packages/approval-api test

# Run tests with coverage
npm run --workspace packages/approval-api test:coverage
```

### Linting

```bash
# Lint all packages
npm run lint

# Fix linting issues
npm run lint:fix

# Lint specific package
npm run --workspace packages/approval-api lint
```

## Migrating Existing Code

### Migration Checklist

When migrating a service to use toolkit packages:

- [ ] Add toolkit dependencies to `package.json`
- [ ] Run `npm install` to link packages
- [ ] Update imports from custom services to toolkit
- [ ] Replace custom HubSpot client with `@hjps/toolkit-hubspot`
- [ ] Replace custom PDF logic with `@hjps/toolkit-pdf`
- [ ] Update environment variable usage
- [ ] Update tests to use toolkit mocks
- [ ] Run tests to verify functionality
- [ ] Update documentation

### Migration Example: hubspotService.js

**Step 1:** Identify what to replace

```javascript
// OLD: packages/approval-api/src/services/hubspotService.js
class HubspotService {
  async getApprovalObject(approvalId) { /* 100+ lines */ }
  async getTimesheets(timesheetIds) { /* 50+ lines */ }
  async updateApprovalObject(id, props) { /* 30+ lines */ }
  // ... many more methods
}
```

**Step 2:** Use toolkit equivalents

```javascript
// NEW: Use toolkit directly in approvalService.js
const { HubSpotClient } = require('@hjps/toolkit-hubspot');

class ApprovalService {
  constructor() {
    this.hubspot = new HubSpotClient({
      environment: process.env.HUBSPOT_ENV,
      token: process.env.PRIVATE_APP_TOKEN
    });
  }

  async processApproval(approvalRequestId) {
    // Direct toolkit methods
    const approval = await this.hubspot.getObject(
      'approval',
      approvalRequestId
    );

    const timesheets = await this.hubspot.getObjectBatch(
      'timesheet',
      approval.properties.timesheet_ids.split(',')
    );

    // ... rest of business logic
  }
}
```

**Step 3:** Remove old service

```bash
# Rename old service for safety
mv packages/approval-api/src/services/hubspotService.js \
   packages/approval-api/src/services/hubspotService.legacy.js

# After confirming everything works, delete it
rm packages/approval-api/src/services/hubspotService.legacy.js
```

## Common Patterns

### Pattern 1: Retry Logic with HubSpot Client

```javascript
const { HubSpotClient } = require('@hjps/toolkit-hubspot');

const hubspot = new HubSpotClient({
  environment: 'production',
  token: process.env.PRIVATE_APP_TOKEN,
  retry: {
    maxRetries: 3,
    retryDelay: 1000
  }
});
```

### Pattern 2: Batch Operations

```javascript
// Get multiple objects efficiently
const timesheetIds = ['123', '456', '789'];
const timesheets = await hubspot.getObjectBatch('timesheet', timesheetIds);

// Update multiple objects
const updates = timesheets.map(ts => ({
  id: ts.id,
  properties: { status: 'approved' }
}));
await hubspot.updateObjectBatch('timesheet', updates);
```

### Pattern 3: Search with Filters

```javascript
// Search for approvals by project
const results = await hubspot.search('approval', {
  filterGroups: [{
    filters: [{
      propertyName: 'approval_project_id',
      operator: 'EQ',
      value: 'PRJ-123'
    }]
  }],
  properties: ['approval_request_id', 'project_name'],
  limit: 100
});
```

## Troubleshooting

### Issue: Toolkit packages not found

**Error:**
```
Error: Cannot find module '@hjps/toolkit-hubspot'
```

**Solution:**
```bash
# Ensure hjps-toolkit is at correct location
ls -la D:\code\hjps-toolkit\packages\toolkit-hubspot

# Reinstall dependencies
cd D:\code\hjps-ops\packages\approval-api
rm -rf node_modules package-lock.json
npm install
```

### Issue: Environment validation fails

**Error:**
```
Environment validation failed: Portal ID mismatch
```

**Solution:**
```bash
# Check your .env file
cat .env | grep HUBSPOT_ENV

# Verify portal configuration
node -e "
const { validateEnvironment } = require('@hjps/toolkit-hubspot/validation');
validateEnvironment('production').then(console.log);
"
```

### Issue: Tests fail after migration

**Solution:**
1. Update test imports to use toolkit mocks
2. Check that environment variables are set in test environment
3. Verify toolkit versions match expected API

```javascript
// In tests
const { HubSpotClient } = require('@hjps/toolkit-hubspot');
const { mockHubSpotResponse } = require('@hjps/toolkit-hubspot/testing');

// Mock toolkit client
jest.mock('@hjps/toolkit-hubspot');
```

## Best Practices

### 1. Use Environment Validation

Always validate environment configuration at startup:

```javascript
const { validateEnvironment } = require('@hjps/toolkit-hubspot/validation');

async function startServer() {
  const validation = await validateEnvironment(process.env.HUBSPOT_ENV);

  if (!validation.valid) {
    console.error('Configuration errors:', validation.errors);
    process.exit(1);
  }

  // Start server...
}
```

### 2. Centralize Client Initialization

Create a single HubSpot client instance and reuse it:

```javascript
// src/config/clients.js
const { HubSpotClient } = require('@hjps/toolkit-hubspot');
const { PDFClient } = require('@hjps/toolkit-pdf');

let hubspotClient;
let pdfClient;

function getHubSpotClient() {
  if (!hubspotClient) {
    hubspotClient = new HubSpotClient({
      environment: process.env.HUBSPOT_ENV,
      token: process.env.PRIVATE_APP_TOKEN
    });
  }
  return hubspotClient;
}

function getPDFClient() {
  if (!pdfClient) {
    pdfClient = new PDFClient({
      baseURL: process.env.PDF_SERVICE_URL
    });
  }
  return pdfClient;
}

module.exports = { getHubSpotClient, getPDFClient };
```

### 3. Handle Errors Gracefully

```javascript
try {
  const approval = await hubspot.getObject('approval', approvalId);
} catch (error) {
  if (error.response?.status === 404) {
    console.warn('Approval not found:', approvalId);
    return null;
  }
  throw error; // Re-throw unexpected errors
}
```

### 4. Log Toolkit Operations

```javascript
const logger = require('./utils/logger');

const hubspot = new HubSpotClient({
  environment: process.env.HUBSPOT_ENV,
  token: process.env.PRIVATE_APP_TOKEN,
  logger: logger // Pass your logger instance
});
```

## Next Steps

1. Review the [Toolkit Integration Strategy](./TOOLKIT_INTEGRATION_STRATEGY.md)
2. Check the [toolkit-hubspot README](D:\code\hjps-toolkit\packages\toolkit-hubspot\README.md)
3. Explore [toolkit-pdf README](D:\code\hjps-toolkit\packages\toolkit-pdf\README.md)
4. See example migrations in `docs/migrations/`

## Support

For issues or questions:
1. Check toolkit package documentation
2. Review troubleshooting section above
3. Create issue in hjps-toolkit repository
4. Contact the Data Engineering team

---

**Maintained by:** H&J Petroleum Data Engineering Team
**Last Updated:** 2025-10-03
