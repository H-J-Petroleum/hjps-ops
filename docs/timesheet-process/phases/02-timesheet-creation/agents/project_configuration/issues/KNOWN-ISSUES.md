# Known Issues

| Issue | Impact | Suggested Mitigation |
| --- | --- | --- |
| No user feedback when WF-10 fails (association or email) | Consultant receives stale or missing portal link; access blocked until rerun. | Add structured logging + agent checklist to confirm WF-10 success before closing approval tickets. |
| Encryption offset (`+3522`) duplicated across workflows | Any change must be applied manually in WF-01 and WF-10; risk of mismatched tokens. | Move encryption/token generation to shared service or helper module. |
| Portal Step 0 allowing locked projects when cache stale | Consultants can attempt entry into locked projects (`hj_project_is_locked`), leading to WF-11 failures. | Refresh project lock state before rendering list; show clear message when locked. |
| HTML stored in `hj_notify_timesheet_link` | Styling drifts from portal theme and is hard to maintain. | Replace with CRM card/UI extension using shared stylesheet. |
