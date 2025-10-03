# Known Issues

| Issue | Impact | Suggested Mitigation |
| --- | --- | --- |
| Missing `hj_consultants` payment_deal_id | Timesheet records lose link to wells/AFE → billing scripts fail. | Add data validation to consultant maintenance process; fail portal submission when payment deal ID absent. |
| Stale contact ↔ project association (210) | Consultant sees no projects or wrong projects, blocking submissions. | Re-run WF-10 or build nightly check to confirm association exists before allowing Step 0 access. |
| Duplicate `timesheet_unique_id` when portal resubmits quickly | WF-11 dedupe may skip records if ordinal numbers reused without increment. | Ensure portal increments `cg_ordinal_numbers`; add server-side logging when duplicates detected. |
