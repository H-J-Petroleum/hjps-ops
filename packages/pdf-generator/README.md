Local PDF Generator

Purpose
- Generate Field Ticket PDFs locally and update HubSpot approval objects with a single URL to the PDF (no base64 chunking).
- Replaces the legacy PHP webhook path with a controllable local service.

Run
- From `config/`: `npm run pdf:serve`
- Health check: `GET http://localhost:3000/health`
- Generate PDF: `POST http://localhost:3000/api/pdf/generate`

Environment
- Reads `HUBSPOT_PRIVATE_APP_TOKEN` from `.env.local` at repo root if present, or process env.
- Storage
  - Default: HubSpot Files (`HJ_STORAGE_PROVIDER=hubspot`) — uploads to the same folders WF-26 used and patches `field_ticket_id/url` or `consultant_field_ticket_id/url`.
  - Optional external: `HJ_STORAGE_PROVIDER=s3` or `local`.
    - S3/MinIO: `HJ_ARTIFACTS_BUCKET`, `HJ_S3_REGION`, `HJ_S3_ENDPOINT` (MinIO), `HJ_S3_ACCESS_KEY_ID`, `HJ_S3_SECRET_ACCESS_KEY`, `HJ_S3_FORCE_PATH_STYLE=true`, `HJ_PRESIGN_EXPIRY_SECONDS`.
    - Local: `HJ_LOCAL_ARTIFACT_DIR` (served under `/files`).

Notes
- Uses PDFKit for rendering and Axios for HubSpot API calls.
- Default behavior uploads to HubSpot Files and patches the approval record like WF-26 does:
  - Customer (Field Ticket): folder `ApprovedFieldTickets`, properties `field_ticket_id` + `field_ticket_url`.
  - Consultant (Timesheet): folder `BillForConsultants`, properties `consultant_field_ticket_id` + `consultant_field_ticket_url`.
- Optional external storage path (S3/MinIO or local) writes only a single URL property if configured.
