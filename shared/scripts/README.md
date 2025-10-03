# Shared Scripts

Node-based CLI tooling migrated from the legacy `hjpshubspot` repo. Scripts are grouped by domain:

- `timesheet/` – schema validation and payload helpers for `hj_timesheets`.
- `approval/` – approval object tooling, payload tests, and debugging utilities.
- `agent/` – agent orchestration helpers that build approval collateral.

These scripts still reference legacy environment variables and HubSpot object IDs. Update imports/config once the services land inside this repo.
