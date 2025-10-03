# Known Issues

| Issue | Impact | Suggested Mitigation |
| --- | --- | --- |
| Array length mismatches (`cg_*`) | WF-11 may create fewer line items than intended, leaving consultants confused. | Add portal-side validation verifying all staged arrays share the same length before allowing submission. |
| Missing pricing on `hj_consultants` | WF-11 writes `timesheet_price` or `timesheet_hj_price` as null, leading to billing gaps. | Build nightly audit comparing consultant records to required pricing fields; block portal submissions when missing. |
| Association IDs not documented in HubSpot | Future schema changes risk breaking WF-10/11 if association IDs change. | Maintain a shared registry (see Phase 01 data relationships) and verify after export regeneration. |
