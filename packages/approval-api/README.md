# 🚀 Approval API Service

**Replaces WF-26 with integrated PDF generation**

## 📋 Overview

The Approval API Service is a Node.js microservice that handles the complete approval workflow for H&J Petroleum timesheets. It replaces the existing WF-26 HubSpot workflow with a more robust, API-driven solution that includes integrated PDF generation.

## 🏗️ Architecture

### **Service Responsibilities**
- **URL Parsing**: Parse approval URLs and extract context
- **Context Resolution**: Resolve approval context from HubSpot
- **Timesheet Approval**: Approve/reject timesheets
- **Property Updates**: Update all 28 approval properties
- **PDF Integration**: Generate PDFs via PDF Generator service
- **Notifications**: Send email notifications
- **Error Handling**: Centralized error management

### **Service Communication**
- **Approval API** → **PDF Generator**: HTTP REST API calls
- **Both Services** → **HubSpot**: Direct API calls
- **Both Services** → **Shared Config**: Environment variables

## 🚀 Quick Start

### **Prerequisites**
- Node.js 18+ 
- npm or yarn
- HubSpot Private App Token
- PDF Generator Service running

### **Installation**

1. **Clone and navigate to service**
   ```bash
   cd src/approval-api
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

5. **Start production server**
   ```bash
   npm start
   ```

## 📡 API Endpoints

### **Health Check**
- `GET /health` - Basic health check
- `GET /health/detailed` - Detailed health check
- `GET /health/ready` - Readiness check
- `GET /health/live` - Liveness check

### **Approval Workflow**
- `POST /api/approval/process` - Process approval workflow
- `GET /api/approval/status/:id` - Get approval status
- `POST /api/approval/retry/:id` - Retry failed approval
- `POST /api/approval/parse-url` - Parse approval URL

### **Request/Response Examples**

#### **Process Approval**
```bash
POST /api/approval/process
Content-Type: application/json

{
  "approvalUrl": "https://app.hubspot.com/contacts/123456789/object/2-12345678/123456789",
  "approvalId": "123456789",
  "pdfType": "customer"
}
```

#### **Response**
```json
{
  "success": true,
  "data": {
    "approvalId": "123456789",
    "status": "approved",
    "pdfUrl": "https://files.hubspot.com/...",
    "timesheetCount": 5,
    "totalAmount": 2500.00
  },
  "timestamp": "2025-09-29T19:00:00.000Z",
  "requestId": "uuid-here"
}
```

## 🔧 Configuration

### **Environment Variables**

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | `3001` |
| `NODE_ENV` | Environment | `development` |
| `LOG_LEVEL` | Logging level | `info` |
| `HUBSPOT_PRIVATE_APP_TOKEN` | HubSpot API token | Required |
| `PDF_GENERATOR_URL` | PDF service URL | `http://localhost:3000` |
| `NOTIFICATIONS_ENABLED` | Enable notifications | `true` |

### **HubSpot Configuration**
- **Approval Object Type ID**: `2-12345678`
- **Timesheet Object Type ID**: `2-87654321`
- **Required Properties**: 28 properties mapped from PowerShell scripts

## 🧪 Testing

### **Run Tests**
```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

### **Test Structure**
```
tests/
├── unit/                    # Unit tests
│   ├── services/           # Service tests
│   ├── utils/              # Utility tests
│   └── middleware/         # Middleware tests
├── integration/            # Integration tests
│   ├── approval-workflow.test.js
│   ├── pdf-integration.test.js
│   └── hubspot-integration.test.js
└── fixtures/               # Test data
    ├── approval-data.json
    ├── timesheet-data.json
    └── pdf-data.json
```

## 📊 Monitoring

### **Health Checks**
- **Basic**: `GET /health` - Service status
- **Detailed**: `GET /health/detailed` - Full health check
- **Readiness**: `GET /health/ready` - Ready to accept requests
- **Liveness**: `GET /health/live` - Service is alive

### **Logging**
- **Structured Logging**: JSON format with request IDs
- **Log Levels**: error, warn, info, http, debug
- **Request Tracking**: Unique request IDs for tracing

## 🚀 Deployment

### **Docker**
```bash
# Build image
docker build -t approval-api .

# Run container
docker run -p 3001:3001 --env-file .env approval-api
```

### **Environment Setup**
1. **Production**: Set `NODE_ENV=production`
2. **HubSpot**: Configure production HubSpot token
3. **PDF Generator**: Point to production PDF service
4. **Monitoring**: Enable production monitoring

## 🔗 Integration

### **With PDF Generator Service**
```javascript
// PDF generation request
const response = await axios.post(`${PDF_GENERATOR_URL}/api/pdf/generate`, {
  approvalId: '123456789',
  pdfType: 'customer',
  approvalData: approvalData
});
```

### **With HubSpot**
```javascript
// HubSpot API calls
const approval = await hubspotService.getApproval(approvalId);
const timesheets = await hubspotService.getTimesheets(timesheetIds);
```

## 📚 Development

### **Project Structure**
```
src/
├── index.js                 # Main server
├── services/                # Business logic
│   ├── approvalService.js   # Main orchestration
│   ├── urlResolverService.js # URL parsing
│   ├── timesheetService.js  # Timesheet approval
│   ├── hubspotService.js    # HubSpot integration
│   ├── pdfIntegrationService.js # PDF integration
│   └── notificationService.js # Notifications
├── utils/                   # Utilities
├── config/                  # Configuration
├── middleware/              # Express middleware
└── routes/                  # API routes
```

### **Code Style**
- **ESLint**: Standard configuration
- **Prettier**: Code formatting
- **JSDoc**: Function documentation
- **Error Handling**: Centralized error management

## 🐛 Troubleshooting

### **Common Issues**

1. **HubSpot API Errors**
   - Check private app token
   - Verify object type IDs
   - Check rate limits

2. **PDF Generator Errors**
   - Verify PDF service is running
   - Check PDF service URL
   - Verify API key

3. **Database Errors**
   - Check connection string
   - Verify database is running
   - Check permissions

### **Debug Mode**
```bash
# Enable debug logging
LOG_LEVEL=debug npm run dev
```

## 📞 Support

- **Documentation**: See `docs/` folder
- **Issues**: Create GitHub issue
- **Logs**: Check application logs
- **Health**: Use health check endpoints

---

**Built with ❤️ for H&J Petroleum**
