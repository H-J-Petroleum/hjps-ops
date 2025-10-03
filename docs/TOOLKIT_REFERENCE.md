# Toolkit Quick Reference Card

**Version:** 1.0
**Last Updated:** 2025-10-03

## Package Versions

| Package | Version | Location |
|---------|---------|----------|
| @hjps/toolkit-hubspot | 1.1.0 | D:\code\hjps-toolkit\packages\toolkit-hubspot |
| @hjps/toolkit-pdf | 1.0.0 | D:\code\hjps-toolkit\packages\toolkit-pdf |
| @hjps/toolkit-config | 0.1.0 | D:\code\hjps-toolkit\packages\toolkit-config (planned) |

## Installation

```bash
# In package.json
{
  "dependencies": {
    "@hjps/toolkit-hubspot": "file:../../../hjps-toolkit/packages/toolkit-hubspot",
    "@hjps/toolkit-pdf": "file:../../../hjps-toolkit/packages/toolkit-pdf"
  }
}

# Install
npm install
```

## Common Imports

```javascript
// HubSpot
const { HubSpotClient } = require('@hjps/toolkit-hubspot');
const { validateEnvironment } = require('@hjps/toolkit-hubspot/validation');

// PDF
const { PDFClient } = require('@hjps/toolkit-pdf');
const { ValueFormattingService } = require('@hjps/toolkit-pdf/formatting');
```

## HubSpot Client Cheat Sheet

### Initialization

```javascript
const hubspot = new HubSpotClient({
  environment: 'production',     // or 'legacySandbox', 'betaSandbox'
  token: 'pat-na1-xxxxxxxx',
  logger: customLogger,          // optional
  retry: {
    maxRetries: 3,
    retryDelay: 1000
  }
});
```

### Single Object Operations

```javascript
// Get by ID
const approval = await hubspot.getObject('approval', '123456', {
  properties: ['approval_request_id', 'project_name'],
  associations: ['timesheets']
});

// Get with fallback search
const approval = await hubspot.getObject('approval', 'AR-12345', {
  fallbackSearch: {
    propertyName: 'approval_request_id',
    value: 'AR-12345'
  }
});

// Update
await hubspot.updateObject('approval', '123456', {
  approval_status: 'approved',
  approval_date: Date.now().toString()
});

// Create
const newApproval = await hubspot.createObject('approval', {
  properties: {
    approval_request_id: 'AR-12345',
    project_name: 'Test Project'
  },
  associations: [
    { to: { id: '789' }, types: [{ associationTypeId: 123 }] }
  ]
});

// Delete
await hubspot.deleteObject('approval', '123456');
```

### Batch Operations

```javascript
// Get multiple objects
const timesheets = await hubspot.getObjectBatch('timesheet', ['123', '456', '789'], {
  properties: ['timesheet_project_name', 'timesheet_quantity'],
  continueOnError: true
});

// Update multiple objects
await hubspot.updateObjectBatch('timesheet', [
  { id: '123', properties: { status: 'approved' } },
  { id: '456', properties: { status: 'approved' } }
]);

// Create multiple objects
await hubspot.createObjectBatch('timesheet', [
  { properties: { timesheet_project_name: 'Project A' } },
  { properties: { timesheet_project_name: 'Project B' } }
]);
```

### Search

```javascript
// Simple search
const results = await hubspot.search('approval', {
  filterGroups: [{
    filters: [{
      propertyName: 'approval_project_id',
      operator: 'EQ',
      value: 'PRJ-123'
    }]
  }],
  properties: ['approval_request_id', 'project_name'],
  limit: 100,
  sorts: [{ propertyName: 'createdate', direction: 'DESCENDING' }]
});

// Complex search with multiple filters
const results = await hubspot.search('approval', {
  filterGroups: [{
    filters: [
      { propertyName: 'approval_status', operator: 'EQ', value: 'pending' },
      { propertyName: 'createdate', operator: 'GT', value: '1609459200000' }
    ]
  }],
  limit: 50
});

// Query search
const results = await hubspot.search('approval', {
  query: 'AR-12345',
  properties: ['approval_request_id'],
  limit: 1
});
```

### Associations

```javascript
// Get associated objects
const timesheets = await hubspot.getAssociations('approval', '123456', 'timesheet');

// Create association
await hubspot.createAssociation('approval', '123456', 'timesheet', '789', {
  associationTypeId: 123
});

// Remove association
await hubspot.removeAssociation('approval', '123456', 'timesheet', '789');
```

## PDF Client Cheat Sheet

### Initialization

```javascript
const pdfClient = new PDFClient({
  baseURL: 'http://localhost:8080',
  timeout: 30000,
  logger: customLogger
});
```

### Generate PDF

```javascript
// Approval PDF
const pdfUrl = await pdfClient.generateApprovalPDF({
  approvalId: 'AR-12345',
  projectName: 'Test Project',
  timesheets: [/* timesheet data */],
  // ... other context
});

// Custom PDF
const pdfUrl = await pdfClient.generatePDF('custom-template', {
  templateData: { /* template-specific data */ }
});
```

### Value Formatting

```javascript
const formatter = new ValueFormattingService();

// Normalize quantity
const normalized = formatter.normalizeQuantity('12.5 hours');
// Result: { value: 12.5, unit: 'hours', formatted: '12.5 hours' }

// Format currency
const formatted = formatter.formatCurrency(1234.56, 'USD');
// Result: '$1,234.56'

// Format date
const formatted = formatter.formatDate('1609459200000', 'MM/DD/YYYY');
// Result: '01/01/2021'
```

## Environment Validation

```javascript
const { validateEnvironment } = require('@hjps/toolkit-hubspot/validation');

// Validate environment
const validation = await validateEnvironment('production');

if (!validation.valid) {
  console.error('Configuration errors:', validation.errors);
  process.exit(1);
}

// Use validated config
const { portalId, objectTypes } = validation.config;
```

## Error Handling Patterns

### Basic Try-Catch

```javascript
try {
  const approval = await hubspot.getObject('approval', 'AR-12345');
} catch (error) {
  if (error.response?.status === 404) {
    console.warn('Approval not found');
    return null;
  }
  throw error;
}
```

### Retry with Exponential Backoff

```javascript
const hubspot = new HubSpotClient({
  environment: 'production',
  token: process.env.PRIVATE_APP_TOKEN,
  retry: {
    maxRetries: 5,
    retryDelay: 1000,
    retryableStatuses: [429, 500, 502, 503, 504]
  }
});
```

### Batch Error Handling

```javascript
const results = await hubspot.getObjectBatch('timesheet', ids, {
  continueOnError: true
});

// Check for errors
results.forEach((result, index) => {
  if (result.error) {
    console.error(`Failed to get timesheet ${ids[index]}:`, result.error);
  } else {
    // Process successful result
  }
});
```

## Testing Patterns

### Mock HubSpot Client

```javascript
jest.mock('@hjps/toolkit-hubspot');

const { HubSpotClient } = require('@hjps/toolkit-hubspot');

beforeEach(() => {
  HubSpotClient.mockImplementation(() => ({
    getObject: jest.fn().mockResolvedValue({ id: '123', properties: {} }),
    updateObject: jest.fn().mockResolvedValue({ id: '123' })
  }));
});
```

### Integration Test with Sandbox

```javascript
describe('HubSpot Integration Tests', () => {
  beforeAll(() => {
    process.env.HUBSPOT_ENV = 'betaSandbox';
  });

  test('retrieves approval from sandbox', async () => {
    const hubspot = new HubSpotClient({
      environment: process.env.HUBSPOT_ENV,
      token: process.env.SANDBOX_TOKEN
    });

    const approval = await hubspot.getObject('approval', 'TEST-AR-001');
    expect(approval).toBeDefined();
  });
});
```

## Common Migration Patterns

### Before: Custom HubSpot Service

```javascript
const hubspot = new HubspotService();
const approval = await hubspot.getApprovalObject('AR-12345');
const timesheets = await hubspot.getTimesheets(['123', '456']);
await hubspot.updateApprovalObject('789', { status: 'approved' });
```

### After: Toolkit Client

```javascript
const hubspot = new HubSpotClient({ environment: 'production', token: TOKEN });
const approval = await hubspot.getObject('approval', 'AR-12345');
const timesheets = await hubspot.getObjectBatch('timesheet', ['123', '456']);
await hubspot.updateObject('approval', '789', { status: 'approved' });
```

## Environment Variables

```bash
# Required
HUBSPOT_ENV=production                    # production | legacySandbox | betaSandbox
PRIVATE_APP_TOKEN=pat-na1-xxxxxxxx       # HubSpot API token

# Optional
PDF_SERVICE_URL=http://localhost:8080    # PDF generator URL
LOG_LEVEL=info                           # error | warn | info | debug
HUBSPOT_RETRY_MAX=3                      # Max retry attempts
HUBSPOT_RETRY_DELAY=1000                 # Retry delay (ms)
```

## Object Type IDs

| Object | Production Portal | Type ID |
|--------|-------------------|---------|
| Approval | 1230608 | 2-26103010 |
| Timesheet | 1230608 | 2-26173281 |
| Project | 1230608 | 2-xxxxxxxx |
| Contact | 1230608 | 0-1 |
| Company | 1230608 | 0-2 |
| Deal | 1230608 | 0-3 |

*Note: Object IDs are managed in toolkit config, no need to hardcode*

## Troubleshooting

### Toolkit not found

```bash
# Verify toolkit location
ls -la D:\code\hjps-toolkit\packages\toolkit-hubspot

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

### Environment validation fails

```bash
# Check environment variable
echo $HUBSPOT_ENV

# Validate manually
node -e "
const { validateEnvironment } = require('@hjps/toolkit-hubspot/validation');
validateEnvironment('production').then(r => console.log(JSON.stringify(r, null, 2)));
"
```

### API rate limiting

```javascript
// Increase retry settings
const hubspot = new HubSpotClient({
  retry: {
    maxRetries: 10,
    retryDelay: 2000,
    retryableStatuses: [429, 500, 502, 503, 504]
  }
});
```

## Best Practices

1. ✅ **Always validate environment at startup**
2. ✅ **Use batch operations for multiple objects**
3. ✅ **Handle 404 errors gracefully**
4. ✅ **Log all HubSpot operations**
5. ✅ **Use continueOnError for batch operations**
6. ✅ **Specify properties to reduce payload size**
7. ✅ **Use fallback search for unique property lookups**
8. ✅ **Implement retry logic for transient failures**

## Documentation Links

- [Toolkit Integration Strategy](./TOOLKIT_INTEGRATION_STRATEGY.md)
- [Toolkit Quick Start](./TOOLKIT_QUICK_START.md)
- [Migration Example](./migrations/01-approval-api-hubspot-migration.md)
- [Refactoring Summary](../REFACTORING_SUMMARY.md)

---

**Quick Help:** `npm run --workspace packages/approval-api dev`
**Support:** Data Engineering Team
