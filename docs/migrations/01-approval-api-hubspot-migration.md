# Migration: approval-api HubSpot Service to Toolkit

**Date:** 2025-10-03
**Status:** In Progress
**Package:** packages/approval-api

## Overview

Migrate `packages/approval-api/src/services/hubspotService.js` from custom implementation to `@hjps/toolkit-hubspot` client.

## Current State

**File:** `packages/approval-api/src/services/hubspotService.js`
**Lines of Code:** ~1,133
**Dependencies:** axios, logger, hubspot config

### Key Methods Being Replaced

| Method | LOC | Toolkit Equivalent |
|--------|-----|-------------------|
| `pullRelatedRecords()` | ~200 | Multiple toolkit methods |
| `getApprovalObject()` | ~100 | `getObject('approval', id)` or `search()` |
| `getTimesheets()` | ~70 | `getObjectBatch('timesheet', ids)` |
| `getProject()` | ~100 | `getObject('project', id)` with fallback |
| `getContact()` | ~20 | `getObject('contact', id)` |
| `getDeal()` | ~20 | `getObject('deal', id)` |
| `getCompany()` | ~20 | `getObject('company', id)` |
| `updateApprovalObject()` | ~30 | `updateObject('approval', id, props)` |
| `updateTimesheets()` | ~30 | `updateObjectBatch('timesheet', updates)` |
| `createNote()` | ~25 | `createObject('note', data)` |
| `enrichContext*()` methods | ~300 | Business logic (keep in approvalService) |

## Migration Plan

### Phase 1: Create Client Wrapper

Create a new client wrapper that uses toolkit under the hood but maintains compatibility with existing code.

**File:** `packages/approval-api/src/services/hubspot/client.js`

```javascript
/**
 * HubSpot Client Wrapper
 * Uses @hjps/toolkit-hubspot for all HubSpot interactions
 */
const { HubSpotClient } = require('@hjps/toolkit-hubspot');
const logger = require('../../utils/logger');

class HubSpotClientWrapper {
  constructor() {
    this.client = new HubSpotClient({
      environment: process.env.HUBSPOT_ENV || 'production',
      token: process.env.PRIVATE_APP_TOKEN || process.env.BEARER_TOKEN,
      logger: logger
    });

    this.config = this.client.config;
    this.logger = logger;
  }

  /**
   * Get object by ID with fallback to search
   * @param {string} objectType - Object type (approval, timesheet, etc.)
   * @param {string} identifier - Object ID or unique property value
   * @param {Object} options - Additional options
   */
  async getObject(objectType, identifier, options = {}) {
    return this.client.getObject(objectType, identifier, options);
  }

  /**
   * Get multiple objects by IDs
   */
  async getObjectBatch(objectType, ids, options = {}) {
    return this.client.getObjectBatch(objectType, ids, options);
  }

  /**
   * Search for objects
   */
  async search(objectType, searchRequest) {
    return this.client.search(objectType, searchRequest);
  }

  /**
   * Update object properties
   */
  async updateObject(objectType, id, properties) {
    return this.client.updateObject(objectType, id, properties);
  }

  /**
   * Update multiple objects
   */
  async updateObjectBatch(objectType, updates) {
    return this.client.updateObjectBatch(objectType, updates);
  }

  /**
   * Create object
   */
  async createObject(objectType, data) {
    return this.client.createObject(objectType, data);
  }
}

module.exports = HubSpotClientWrapper;
```

### Phase 2: Migrate Core Methods

Replace custom implementations with toolkit calls:

#### 2.1 getApprovalObject → toolkit

**Before:**
```javascript
async getApprovalObject(approvalIdentifier) {
  const properties = [ /* long list */ ].join(',');
  const basePath = `${this.config.endpoints.objects}/${this.config.objectTypes.approval}`;

  try {
    const response = await this.client.get(
      `${basePath}/${approvalIdentifier}`,
      { params: { properties } }
    );
    return response.data;
  } catch (error) {
    if (error.response?.status !== 404) throw error;

    // Fallback to search
    const searchResponse = await this.client.post(
      `${basePath}/search`,
      { /* search payload */ }
    );
    return searchResponse.data.results?.[0];
  }
}
```

**After:**
```javascript
async getApprovalObject(approvalIdentifier) {
  const properties = [
    'approval_request_id',
    'approval_project_id',
    'project_name',
    // ... other properties
  ];

  try {
    // Toolkit handles fallback logic automatically
    return await this.client.getObject('approval', approvalIdentifier, {
      properties,
      fallbackSearch: {
        propertyName: 'approval_request_id',
        value: approvalIdentifier
      }
    });
  } catch (error) {
    this.logger.warn('Approval object not found', { approvalIdentifier });
    return null;
  }
}
```

#### 2.2 getTimesheets → toolkit batch

**Before:**
```javascript
async getTimesheets(timesheetIds) {
  const ids = Array.isArray(timesheetIds) ? timesheetIds : [timesheetIds];
  const properties = [ /* list */ ].join(',');

  const timesheets = [];
  for (const id of ids) {
    try {
      const response = await this.client.get(
        `${this.config.endpoints.objects}/${this.config.objectTypes.timesheet}/${id}`,
        { params: { properties } }
      );
      timesheets.push(response.data);
    } catch (error) {
      this.logger.warn('Failed to retrieve individual timesheet', { timesheetId: id });
    }
  }
  return timesheets;
}
```

**After:**
```javascript
async getTimesheets(timesheetIds) {
  const ids = Array.isArray(timesheetIds) ? timesheetIds : [timesheetIds];

  const properties = [
    'timesheet_project_name',
    'timesheet_customer',
    'timesheet_operator',
    // ... other properties
  ];

  // Toolkit handles batch retrieval with proper error handling
  return await this.client.getObjectBatch('timesheet', ids, {
    properties,
    continueOnError: true // Don't fail entire batch if one fails
  });
}
```

#### 2.3 updateApprovalObject → toolkit

**Before:**
```javascript
async updateApprovalObject(approvalId, properties) {
  const response = await this.client.patch(
    `${this.config.endpoints.objects}/${this.config.objectTypes.approval}/${approvalId}`,
    { properties: this.mapPropertiesToHubSpot(properties) }
  );
  return response.data;
}
```

**After:**
```javascript
async updateApprovalObject(approvalId, properties) {
  return await this.client.updateObject('approval', approvalId, properties);
}
```

### Phase 3: Migrate Context Enrichment Logic

The enrichment logic (`enrichContextFrom*` methods) contains business logic and should be moved to a separate service.

**File:** `packages/approval-api/src/services/hubspot/contextEnricher.js`

```javascript
/**
 * Context Enrichment Service
 * Business logic for enriching approval context from HubSpot objects
 */
class ContextEnricher {
  /**
   * Enrich context with approval object data
   */
  enrichFromApproval(context, approval) {
    const props = approval.properties || {};

    const propertyMappings = {
      'approval_request_id': 'approvalRequestId',
      'approval_project_id': 'projectId',
      'project_name': 'projectName',
      // ... rest of mappings
    };

    Object.entries(propertyMappings).forEach(([hubspotProp, contextKey]) => {
      const value = props[hubspotProp];
      if (value && !context[contextKey]) {
        context[contextKey] = value;
      }
    });

    return context;
  }

  /**
   * Enrich context with timesheets data
   */
  enrichFromTimesheets(context, timesheets) {
    // ... existing enrichment logic
    return context;
  }

  // ... other enrichment methods
}

module.exports = ContextEnricher;
```

### Phase 4: Refactor pullRelatedRecords

Combine toolkit client + context enricher for the main orchestration method.

**File:** `packages/approval-api/src/services/approvalContextService.js`

```javascript
/**
 * Approval Context Service
 * Orchestrates pulling related records and enriching context
 */
const HubSpotClientWrapper = require('./hubspot/client');
const ContextEnricher = require('./hubspot/contextEnricher');

class ApprovalContextService {
  constructor() {
    this.hubspot = new HubSpotClientWrapper();
    this.enricher = new ContextEnricher();
    this.logger = require('../utils/logger');
  }

  async pullRelatedRecords(context) {
    this.logger.info('Pulling related records from HubSpot', {
      approvalRequestId: context.approvalRequestId,
      projectId: context.projectId
    });

    try {
      // Get approval object
      const approval = await this.hubspot.getApprovalObject(
        context.approvalRequestId
      );

      if (approval) {
        context.approvalObjectId = approval.id;
        context.approval = approval;
        this.enricher.enrichFromApproval(context, approval);
      }

      // Get timesheets
      if (context.approvalTimesheetIds) {
        const timesheets = await this.hubspot.getTimesheets(
          context.approvalTimesheetIds
        );
        context.timesheets = timesheets;
        this.enricher.enrichFromTimesheets(context, timesheets);
      }

      // Get project if needed
      if (context.projectId && this.needsProjectData(context)) {
        const project = await this.hubspot.getObject('project', context.projectId);
        if (project) {
          context.project = project;
          this.enricher.enrichFromProject(context, project);
        }
      }

      // ... rest of orchestration logic

      return context;

    } catch (error) {
      this.logger.error('Failed to pull related records', { error: error.message });
      throw error;
    }
  }

  needsProjectData(context) {
    return !context.approverEmail || !context.approverName || !context.salesDealId;
  }
}

module.exports = ApprovalContextService;
```

### Phase 5: Update Dependencies

**File:** `packages/approval-api/src/services/approvalService.js`

**Before:**
```javascript
const HubspotService = require('./hubspotService');

class ApprovalService {
  constructor() {
    this.hubspot = new HubspotService();
  }

  async processApproval(approvalRequestId) {
    const context = await this.hubspot.pullRelatedRecords({
      approvalRequestId
    });
    // ... rest of logic
  }
}
```

**After:**
```javascript
const ApprovalContextService = require('./approvalContextService');

class ApprovalService {
  constructor() {
    this.contextService = new ApprovalContextService();
  }

  async processApproval(approvalRequestId) {
    const context = await this.contextService.pullRelatedRecords({
      approvalRequestId
    });
    // ... rest of logic
  }
}
```

## Testing Strategy

### Unit Tests

Create tests for new services using toolkit mocks:

**File:** `packages/approval-api/src/tests/hubspot/client.test.js`

```javascript
const HubSpotClientWrapper = require('../../services/hubspot/client');
const { HubSpotClient } = require('@hjps/toolkit-hubspot');

jest.mock('@hjps/toolkit-hubspot');

describe('HubSpotClientWrapper', () => {
  let wrapper;
  let mockClient;

  beforeEach(() => {
    mockClient = {
      getObject: jest.fn(),
      getObjectBatch: jest.fn(),
      updateObject: jest.fn()
    };
    HubSpotClient.mockImplementation(() => mockClient);
    wrapper = new HubSpotClientWrapper();
  });

  test('getApprovalObject retrieves approval by ID', async () => {
    const mockApproval = { id: '123', properties: {} };
    mockClient.getObject.mockResolvedValue(mockApproval);

    const result = await wrapper.getApprovalObject('123');

    expect(mockClient.getObject).toHaveBeenCalledWith(
      'approval',
      '123',
      expect.any(Object)
    );
    expect(result).toEqual(mockApproval);
  });

  // ... more tests
});
```

### Integration Tests

Test against sandbox environment:

**File:** `packages/approval-api/src/tests/integration/approvalContext.integration.test.js`

```javascript
const ApprovalContextService = require('../../services/approvalContextService');

describe('ApprovalContextService Integration', () => {
  let service;

  beforeEach(() => {
    process.env.HUBSPOT_ENV = 'betaSandbox';
    service = new ApprovalContextService();
  });

  test('pullRelatedRecords retrieves complete context', async () => {
    const context = await service.pullRelatedRecords({
      approvalRequestId: 'AR-TEST-001'
    });

    expect(context.approval).toBeDefined();
    expect(context.timesheets).toBeInstanceOf(Array);
    expect(context.project).toBeDefined();
  });

  // ... more integration tests
});
```

## Rollout Plan

### Step 1: Create New Services (Week 1)
- Create `hubspot/client.js`
- Create `hubspot/contextEnricher.js`
- Create `approvalContextService.js`
- Add unit tests

### Step 2: Update Dependencies (Week 1)
- Update `approvalService.js` to use new services
- Keep old `hubspotService.js` as fallback
- Run tests to verify compatibility

### Step 3: Gradual Cutover (Week 2)
- Test in development environment
- Deploy to staging
- Monitor logs for errors
- Deploy to production with feature flag

### Step 4: Cleanup (Week 2)
- Remove old `hubspotService.js`
- Update all references
- Remove feature flag
- Update documentation

## Metrics & Success Criteria

- [ ] All existing tests pass
- [ ] Code coverage maintained or improved (target: 80%)
- [ ] Lines of code reduced by >50%
- [ ] No regression in API response times
- [ ] Zero production errors during cutover
- [ ] Team trained on new patterns

## Risks & Mitigation

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Breaking API changes | Low | High | Comprehensive test suite |
| Performance degradation | Medium | Medium | Load testing, benchmarks |
| Missing edge cases | Medium | High | Code review, gradual rollout |
| Team unfamiliarity | High | Low | Training, documentation |

## Rollback Plan

If issues occur:
1. Revert to previous commit
2. Restore `hubspotService.js` from backup
3. Update imports back to old service
4. Investigate root cause before retry

## References

- [Toolkit Integration Strategy](../TOOLKIT_INTEGRATION_STRATEGY.md)
- [Toolkit Quick Start](../TOOLKIT_QUICK_START.md)
- [@hjps/toolkit-hubspot API Docs](../../node_modules/@hjps/toolkit-hubspot/README.md)

---

**Status:** Ready for implementation
**Assigned:** Data Engineering Team
**Timeline:** 2 weeks
