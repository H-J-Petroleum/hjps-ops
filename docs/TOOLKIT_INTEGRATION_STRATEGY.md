# Toolkit Integration Strategy for hjps-ops

**Created:** 2025-10-03
**Status:** Draft
**Owner:** Data Engineering Team

## Overview

This document outlines the strategy for refactoring the `hjps-ops` repository to consume shared packages from `hjps-toolkit`, aligning with the toolbox standards defined in the architecture.

## Current State

### Repository Structure (hjps-ops)
```
hjps-ops/
├── packages/
│   ├── approval-api/          # Express service (ported from legacy)
│   ├── pdf-generator/         # PDF microservice + storage adapters
│   └── hubspot-custom-code/   # HubSpot workflow functions
├── shared/
│   ├── config/                # Env schema, lint/test configs
│   └── scripts/               # Cross-service CLI tooling
└── docs/
    └── issues/                # Migration copies of issue workspaces
```

### Available Toolkit Packages
- **@hjps/toolkit-hubspot** v1.1.0 - HubSpot API client, environment validation
- **@hjps/toolkit-pdf** v1.0.0 - PDF generation client, formatters
- **@hjps/toolkit-config** (planned) - Shared configs
- **@hjps/toolkit-cli** (planned) - CLI commands

## Goals

1. **Eliminate Duplication**: Replace custom HubSpot/PDF implementations with toolkit packages
2. **Enforce Governance**: Use shared schema registry and validation
3. **Improve Maintainability**: Single source of truth for common logic
4. **Enable Cross-Repo Consistency**: Same behavior across hjpshubspot, hjps-ops, hubspot-dataops
5. **Simplify Testing**: Shared test fixtures and mocks

## Migration Phases

### Phase 1: Setup Package Dependencies ✅ (Current)

**Tasks:**
- [x] Link `@hjps/toolkit-hubspot` from hjps-toolkit repo
- [x] Link `@hjps/toolkit-pdf` from hjps-toolkit repo
- [ ] Update `package.json` files with correct dependencies
- [ ] Configure npm link or file: protocol for local development
- [ ] Set up CI to handle toolkit package resolution

**Files to Update:**
- `package.json` (root)
- `packages/approval-api/package.json`
- `packages/hubspot-custom-code/package.json`
- `packages/pdf-generator/package.json`

### Phase 2: Migrate approval-api HubSpot Integration

**Current Implementation:**
- `packages/approval-api/src/services/hubspotService.js` (1,133 lines)
  - Custom axios client with interceptors
  - Manual property mapping and enrichment
  - Hardcoded object type IDs
  - Duplicated search/fallback logic

**Target Implementation:**
```javascript
// Before
const HubspotService = require('./services/hubspotService');
const hubspot = new HubspotService();

// After
import { HubSpotClient } from '@hjps/toolkit-hubspot';
const hubspot = new HubSpotClient({
  environment: process.env.HUBSPOT_ENV || 'production',
  token: process.env.PRIVATE_APP_TOKEN
});
```

**Migration Steps:**
1. Update imports to use toolkit client
2. Replace custom `pullRelatedRecords()` with toolkit methods
3. Replace custom `getApprovalObject()`, `getTimesheets()`, etc. with toolkit equivalents
4. Remove hardcoded object type IDs (use environment config)
5. Replace manual enrichment logic with toolkit utilities
6. Update tests to use toolkit mocks

**Files to Update:**
- `packages/approval-api/src/services/hubspotService.js` → Delete or rename to `hubspotServiceLegacy.js`
- `packages/approval-api/src/services/approvalService.js` → Update to use toolkit
- `packages/approval-api/src/services/timesheetService.js` → Update to use toolkit
- `packages/approval-api/src/config/hubspot.js` → Simplify or remove

**Testing Strategy:**
- Create integration tests using toolkit mocks
- Validate backward compatibility with existing API contracts
- Test environment switching (production, legacySandbox, betaSandbox)

### Phase 3: Migrate approval-api PDF Integration

**Current Implementation:**
- `packages/approval-api/src/services/wf26PdfGenerationService.js`
- `packages/approval-api/src/services/pdfIntegrationService.js`
- Custom PDF client implementation

**Target Implementation:**
```javascript
// Before
const pdfClient = axios.create({ baseURL: PDF_SERVICE_URL });

// After
import { PDFClient } from '@hjps/toolkit-pdf';
const pdfClient = new PDFClient({
  baseURL: process.env.PDF_SERVICE_URL,
  timeout: 30000
});
```

**Migration Steps:**
1. Replace custom PDF client with `@hjps/toolkit-pdf/client`
2. Use shared formatting utilities from `@hjps/toolkit-pdf/formatting`
3. Update quantity normalization to use toolkit helpers
4. Consolidate PDF generation logic

**Files to Update:**
- `packages/approval-api/src/services/wf26PdfGenerationService.js` → Update to use toolkit
- `packages/approval-api/src/services/pdfIntegrationService.js` → Update to use toolkit

### Phase 4: Extract Shared Config to toolkit-config

**Current Config Locations:**
- `shared/config/.eslintrc.js`
- `shared/config/jest.config.js`
- HubSpot environment configurations

**Target:**
- Move to `hjps-toolkit/packages/toolkit-config`
- Make available as `@hjps/toolkit-config`

**Migration Steps:**
1. Create `toolkit-config` package in hjps-toolkit repo
2. Move ESLint, Jest, TypeScript configs to toolkit-config
3. Export environment schemas (Joi/Zod)
4. Update hjps-ops to consume `@hjps/toolkit-config`

**Files to Create:**
```
hjps-toolkit/packages/toolkit-config/
├── package.json
├── src/
│   ├── index.js
│   ├── eslint/
│   │   └── base.js
│   ├── jest/
│   │   └── base.js
│   └── env/
│       └── schemas.js
└── README.md
```

**Files to Update:**
- `hjps-ops/shared/config/.eslintrc.js` → Import from toolkit-config
- `hjps-ops/shared/config/jest.config.js` → Import from toolkit-config

### Phase 5: Update hubspot-custom-code Package

**Current Implementation:**
- `packages/hubspot-custom-code/src/internal-approval-handler/`
- Custom HubSpot interaction logic
- Duplicated validation and property mapping

**Target Implementation:**
```javascript
// In HubSpot workflow custom code
import { HubSpotClient, validateEnvironment } from '@hjps/toolkit-hubspot';

exports.main = async (event) => {
  const validation = await validateEnvironment(event.secrets.HUBSPOT_ENV);
  if (!validation.valid) {
    throw new Error('Invalid environment configuration');
  }

  const hubspot = new HubSpotClient({
    environment: event.secrets.HUBSPOT_ENV,
    token: event.secrets.PRIVATE_APP_TOKEN
  });

  // Use toolkit methods...
};
```

**Migration Steps:**
1. Update package.json to include toolkit dependencies
2. Replace custom HubSpot client with toolkit
3. Use shared validation utilities
4. Update tests to use toolkit mocks

**Files to Update:**
- `packages/hubspot-custom-code/src/internal-approval-handler/package.json`
- `packages/hubspot-custom-code/src/internal-approval-handler/index.js`
- `packages/hubspot-custom-code/src/internal-approval-handler/lib/*.js`

### Phase 6: Testing & Validation

**Testing Strategy:**
1. **Unit Tests**: Use toolkit-provided mocks and fixtures
2. **Integration Tests**: Test against sandbox environments
3. **Contract Tests**: Validate API contracts remain unchanged
4. **Regression Tests**: Ensure existing workflows continue working

**Test Coverage Goals:**
- approval-api: 80%+ coverage
- hubspot-custom-code: 75%+ coverage
- PDF integration: 70%+ coverage

**Validation Checklist:**
- [ ] All existing API endpoints return same responses
- [ ] HubSpot object updates work correctly
- [ ] PDF generation produces identical output
- [ ] Email notifications send successfully
- [ ] Error handling matches previous behavior
- [ ] Logging output is consistent

### Phase 7: Documentation Updates

**Documentation to Update:**
1. **README.md** (root) - Update with toolkit dependencies
2. **API Documentation** - Reference toolkit packages
3. **Setup Guides** - Include toolkit installation steps
4. **Architecture Docs** - Reflect toolkit integration
5. **Troubleshooting** - Add toolkit-specific debugging

**New Documentation to Create:**
1. **TOOLKIT_USAGE.md** - How to use toolkit packages in this repo
2. **MIGRATION_GUIDE.md** - For developers migrating from legacy code
3. **TESTING_WITH_TOOLKIT.md** - Testing patterns and mocks

## Benefits

### Before (Current State)
- **3 repositories** with duplicated HubSpot client code
- **~1,100 lines** of custom HubSpot service per repo
- **Manual synchronization** of object IDs and property names
- **Inconsistent error handling** across repos
- **Duplicate test fixtures**

### After (With Toolkit)
- **Single source of truth** for HubSpot interactions
- **Shared validation** and environment management
- **Consistent error handling** via toolkit
- **Reduced maintenance burden** (fix once, benefit everywhere)
- **Easier onboarding** (one pattern to learn)

## Risk Mitigation

### Potential Risks

1. **Breaking Changes**: Migration could introduce bugs
   - *Mitigation*: Comprehensive test suite, gradual rollout

2. **Performance Degradation**: Toolkit adds overhead
   - *Mitigation*: Performance benchmarks before/after

3. **Dependency Coupling**: Tight coupling to toolkit versions
   - *Mitigation*: Semantic versioning, changelog discipline

4. **Development Workflow Changes**: Local linking complexity
   - *Mitigation*: Clear documentation, npm scripts for setup

### Rollback Plan

If issues arise post-migration:
1. Revert to previous commit (Git)
2. Restore legacy service files from backup
3. Update imports back to legacy code
4. Deploy previous version to production

## Timeline

| Phase | Duration | Dependencies |
|-------|----------|--------------|
| Phase 1: Setup Dependencies | 1 day | None |
| Phase 2: Migrate HubSpot Integration | 3 days | Phase 1 |
| Phase 3: Migrate PDF Integration | 2 days | Phase 1 |
| Phase 4: Extract Shared Config | 2 days | None (parallel) |
| Phase 5: Update Custom Code | 2 days | Phase 2 |
| Phase 6: Testing & Validation | 3 days | Phases 2,3,5 |
| Phase 7: Documentation | 1 day | All phases |

**Total Estimated Duration:** 14 days (2-3 weeks with buffer)

## Success Criteria

1. ✅ All tests passing with toolkit packages
2. ✅ No regression in existing functionality
3. ✅ Reduced lines of code in hjps-ops (>50% reduction in duplicated logic)
4. ✅ Improved code quality metrics (ESLint, coverage)
5. ✅ Documentation complete and accurate
6. ✅ Team trained on toolkit usage

## Next Steps

1. Review this strategy with team
2. Get approval for migration approach
3. Create tracking issues for each phase
4. Begin Phase 1: Setup Package Dependencies
5. Schedule regular sync meetings during migration

## References

- [Toolbox Standards](D:\code\hjpshubspot\docs\standards\toolbox.md)
- [@hjps/toolkit-hubspot README](D:\code\hjps-toolkit\packages\toolkit-hubspot\README.md)
- [@hjps/toolkit-pdf README](D:\code\hjps-toolkit\packages\toolkit-pdf\README.md)
- [hjps-ops README](D:\code\hjps-ops\README.md)
