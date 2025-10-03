Setup

Prerequisites
- Node.js 16+
- Valid HubSpot Private App token with CRM object read/write.

Environment
- Add `HUBSPOT_PRIVATE_APP_TOKEN` to `.env.local` at repo root, or export it in your shell.
- Optional overrides: `HJ_APPROVAL_OBJECT_TYPE_ID`, `HJ_TIMESHEET_OBJECT_TYPE_ID`.

Install & Run
- From `config/`: `npm install` (once), then `npm run pdf:serve`.
- Health check: `Invoke-WebRequest http://localhost:3000/health` (PowerShell) or curl.

Generate PDF (example)
PowerShell
```
Invoke-RestMethod -Method Post -Uri http://localhost:3000/api/pdf/generate -Body (@{ approvalId = '12345'; pdfType = 'customer' } | ConvertTo-Json) -ContentType 'application/json'
```

Troubleshooting
- Check logs in the console for errors.
- Validate your token: wrong or missing token yields 401 from HubSpot.
- Ensure approval/timesheet object IDs in `config/hubspot.js` match your environment.
- Default storage is HubSpot Files; verify folders (`ApprovedFieldTickets`, `BillForConsultants`) or override via env.
