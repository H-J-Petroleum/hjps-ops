# H&J Petroleum Operations Platform

New home for HubSpot bypass tooling and supporting services that underpin the operational environment (timesheets, approvals, projects, docs). Uses shared `@hjps/toolkit-*` packages for HubSpot integration, PDF generation, and configuration management.

## Repository Layout
```
packages/
  approval-api/          # Express service with toolkit integration
  pdf-generator/         # PDF microservice + storage adapters
  hubspot-custom-code/   # HubSpot workflow functions using toolkit
shared/
  config/                # Env schema, lint/test configs, telemetry defaults
  scripts/               # Cross-service CLI tooling
docs/
  TOOLKIT_INTEGRATION_STRATEGY.md  # Toolkit migration strategy
  TOOLKIT_QUICK_START.md           # Getting started with toolkit
  migrations/                       # Migration guides & examples
  issues/                           # Migration copies of issue workspaces
.github/
  workflows/             # CI: lint, test, contract checks
```

## Quick Start

### Prerequisites
- Node.js >= 18.0.0
- npm >= 8.0.0
- [hjps-toolkit](https://github.com/H-J-Petroleum/hjps-toolkit) cloned locally at `D:\code\hjps-toolkit`

### Installation

```bash
# Clone repository
git clone <repository-url> hjps-ops
cd hjps-ops

# Install dependencies (automatically links toolkit packages)
npm install

# Install workspace dependencies
npm install --workspaces
```

### Environment Setup

Create a `.env` file in the repository root:

```bash
# HubSpot Configuration
HUBSPOT_ENV=production                    # production | legacySandbox | betaSandbox
PRIVATE_APP_TOKEN=pat-na1-xxxxxxxx       # HubSpot private app token

# PDF Service
PDF_SERVICE_URL=http://localhost:8080

# API Service
PORT=3001
NODE_ENV=development
ALLOWED_ORIGINS=http://localhost:3000
```

## Toolkit Integration

This repository uses shared packages from [hjps-toolkit](https://github.com/H-J-Petroleum/hjps-toolkit):

- **@hjps/toolkit-hubspot** v1.1.0 - HubSpot API client, environment validation
- **@hjps/toolkit-pdf** v1.0.0 - PDF generation client, formatters

### Usage Example

```javascript
const { HubSpotClient } = require('@hjps/toolkit-hubspot');
const { PDFClient } = require('@hjps/toolkit-pdf');

// Initialize clients
const hubspot = new HubSpotClient({
  environment: process.env.HUBSPOT_ENV,
  token: process.env.PRIVATE_APP_TOKEN
});

const pdfClient = new PDFClient({
  baseURL: process.env.PDF_SERVICE_URL
});

// Use toolkit methods
const approval = await hubspot.getObject('approval', 'AR-12345');
const pdfUrl = await pdfClient.generateApprovalPDF(context);
```

For detailed usage instructions, see [TOOLKIT_QUICK_START.md](docs/TOOLKIT_QUICK_START.md).

## Development

### Running Services

```bash
# Start approval-api in development mode
npm run --workspace packages/approval-api dev

# Start with specific environment
HUBSPOT_ENV=betaSandbox npm run --workspace packages/approval-api dev
```

### Testing

```bash
# Run all tests
npm test

# Run tests for specific package
npm run --workspace packages/approval-api test

# Run tests with coverage
npm run test:coverage
```

### Linting

```bash
# Lint all packages
npm run lint

# Fix linting issues automatically
npm run lint:fix
```

## Architecture

### Toolbox Alignment

This repository follows the [Toolbox Standards](https://github.com/H-J-Petroleum/hjpshubspot/blob/main/docs/standards/toolbox.md) which define shared components across all H&J Petroleum implementations:

- **Data Contracts**: MariaDB schema registry mirrors HubSpot exports
- **Business Logic**: Shared helper library for URL generation, validation, audit logging
- **UI/UX**: `hj-foundations-ui.css/js` kit for consistent styling
- **Storage**: MinIO/S3 artifact helper for uploads
- **AI Runtime**: LanceDB vector store + router policy

### Service Architecture

```
┌─────────────────────────────────────────────────────┐
│                  approval-api                        │
│  ┌──────────────┐  ┌─────────────┐  ┌────────────┐ │
│  │ HubSpot      │  │ PDF         │  │ Email      │ │
│  │ Integration  │  │ Generation  │  │ Service    │ │
│  │ (toolkit)    │  │ (toolkit)   │  │            │ │
│  └──────────────┘  └─────────────┘  └────────────┘ │
└─────────────────────────────────────────────────────┘
           │                    │
           ▼                    ▼
  ┌─────────────────┐  ┌──────────────────┐
  │ @hjps/toolkit-  │  │ @hjps/toolkit-   │
  │ hubspot         │  │ pdf              │
  └─────────────────┘  └──────────────────┘
           │                    │
           ▼                    ▼
  ┌─────────────────┐  ┌──────────────────┐
  │ HubSpot API     │  │ PDF Generator    │
  │ (Portal 1230608)│  │ Service          │
  └─────────────────┘  └──────────────────┘
```

## Migration Status

### Completed
- ✅ Toolkit packages linked and installed
- ✅ Package dependencies configured
- ✅ Documentation created (strategy, quick start, migration guides)
- ✅ Example migration plan for approval-api

### In Progress
- 🔄 Migrate approval-api HubSpot service to toolkit
- 🔄 Migrate approval-api PDF integration to toolkit
- 🔄 Update hubspot-custom-code to use toolkit

### Planned
- ⏳ Extract shared config to @hjps/toolkit-config
- ⏳ Create comprehensive test suite with toolkit mocks
- ⏳ Update CI/CD pipeline for toolkit integration

See [TOOLKIT_INTEGRATION_STRATEGY.md](docs/TOOLKIT_INTEGRATION_STRATEGY.md) for complete migration plan.

## Documentation

- [Toolkit Integration Strategy](docs/TOOLKIT_INTEGRATION_STRATEGY.md) - Overall migration approach
- [Toolkit Quick Start](docs/TOOLKIT_QUICK_START.md) - Getting started guide
- [Migration Examples](docs/migrations/) - Detailed migration guides
- [API Documentation](docs/api/) - Service API references (TODO)

## Contributing

1. Create feature branch
2. Make changes following toolkit patterns
3. Add tests (target: 80% coverage)
4. Update documentation
5. Submit pull request

### Code Quality Standards

- All new code must use `@hjps/toolkit-*` packages
- No direct HubSpot API calls (use toolkit client)
- Follow ESLint configuration
- Maintain or improve test coverage
- Document all public APIs

## Support

For questions or issues:
1. Check [Toolkit Quick Start](docs/TOOLKIT_QUICK_START.md) guide
2. Review migration examples in `docs/migrations/`
3. Contact Data Engineering team
4. Create issue in this repository

## License

MIT

---

**Maintained by:** H&J Petroleum Data Engineering Team
**Related Repositories:**
- [hjps-toolkit](https://github.com/H-J-Petroleum/hjps-toolkit) - Shared packages
- [hjpshubspot](https://github.com/H-J-Petroleum/hjpshubspot) - Legacy HubSpot integration
- [hubspot-dataops](https://github.com/H-J-Petroleum/hubspot-dataops) - Data operations
