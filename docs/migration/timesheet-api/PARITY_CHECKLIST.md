# Sandbox Parity Checklist

Use this checklist before routing production traffic to the `hjps-ops` services.

- [ ] Approval API smoke test (`npm --workspace packages/approval-api test` or equivalent) passes.
- [ ] PDF generator smoke test runs via `npm --workspace packages/pdf-generator test` and manual PDF generation.
- [ ] Consultant/project bootstrap scripts create sandbox records without errors.
- [ ] Timesheet API payload scripts create sample entries and populate `approval_timesheet_ids_array`.
- [ ] Approval submission scripts generate an approval object and trigger WF-13 reminders.
- [ ] Generated PDFs include unit normalization fixes (customer + consultant variants).
- [ ] Monitoring/logging outputs verified in sandbox deployment.
- [ ] Backfill scripts produce identical HubSpot payload diffs when compared to legacy repo.

Document results and link to run logs before switching endpoints.
