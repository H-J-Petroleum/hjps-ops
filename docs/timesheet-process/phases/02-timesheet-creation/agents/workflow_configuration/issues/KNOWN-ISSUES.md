# Known Issues

| Issue | Impact | Suggested Mitigation |
| --- | --- | --- |
| Missing update workflow export | Cannot verify how edits patch existing `hj_timesheets`; risk of duplicate records. | Locate/export the update workflow or design replacement before changing portal logic. |
| WF-11 lacks structured logging | Failures appear only in workflow history; consultants receive no feedback. | Add logging + status property (see improvement plan) and surface results in portal. |
| Hard-coded encryption offset `+3522` reused across workflows | If changed in one workflow, others may generate mismatched links. | Centralize encryption/token generation once shared service is available. |
