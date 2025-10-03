# Known Issues

| Issue | Impact | Suggested Mitigation |
| --- | --- | --- |
| Missing approval request workflow export | Hard to verify that Phase 03 picks up `approval_timesheet_ids_array` correctly; troubleshooting requires portal logs. | Re-run workflow exporter for WF-08/WF-09 or request read-only view before making portal changes. |
| Duplicate staging arrays (`cg_*` vs `approval_*`) | Inconsistent delimiter handling can cause mismatched counts (WF-11 creates fewer lines than submitted). | Add validation script before form submission to confirm counts match; highlight mismatches to consultant. |
| Resubmit form optional fields (`approval_customer_comment`, `where_did_you_grow_up_`) rarely used | Agents may ignore context when re-approving, leading to incomplete audit trail. | Update UI copy to encourage usage or retire unused fields after stakeholder review. |
| Approver metadata relies on Phase 01 configuration | If `approver_email` or `approver_unique_id` missing, approval request silently fails downstream. | Add pre-submit check in module to ensure approver fields are populated before enabling CTA. |
