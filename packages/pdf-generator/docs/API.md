PDF Generator API

Endpoints
- GET `/health`
  - Returns `{ status, timestamp }` for monitoring.

- POST `/api/pdf/generate`
  - Body: `{ approvalId: string, pdfType: 'customer' | 'consultant' | 'internal' | 'invoice' }`
  - Default storage: HubSpot Files — uploads to `ApprovedFieldTickets` (customer) or `BillForConsultants` (consultant), then updates approval with `{field_ticket_id,url}` or `{consultant_field_ticket_id,url}` accordingly. Returns `{ success, approvalId, pdfType, fileId, url, folderPath, timestamp }`.
  - Optional external storage (S3/local via env) updates only the URL property configured in `hubspot.js`.

Notes
- Requires `HUBSPOT_PRIVATE_APP_TOKEN` in environment or `.env.local` at repo root.
- Object/type IDs and property names are configured in `src/pdf-generator/src/config/hubspot.js`.
- Storage config is in `src/pdf-generator/src/config/storage.js`.
