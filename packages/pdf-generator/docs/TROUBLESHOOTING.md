Troubleshooting

Common issues
- 401 Unauthorized: Check `HUBSPOT_PRIVATE_APP_TOKEN` and scopes.
- 404 Object not found: Verify `approvalId` exists in the approval object type.
- Timesheets empty: Ensure filters (project/request/consultant) are correct.
- Signature missing: `signature_new` must be data URL or base64 image.
- HubSpot Files upload fails: confirm `HJ_STORAGE_PROVIDER=hubspot` (default), token scopes include Files, and folderPath is valid.

Diagnostics
- Call `/health` to confirm server availability.
- Temporarily log HubSpot responses by adding `logger.info` lines in `hubspotService.js`.

Adjustments
- Update object type IDs and property mappings in `src/pdf-generator/src/config/hubspot.js` for your portal.
