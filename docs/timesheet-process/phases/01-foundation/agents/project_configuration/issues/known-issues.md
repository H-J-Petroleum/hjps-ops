# Known Issues – Project Configuration (Foundations)

Document ongoing blockers surfaced while running WF-01/WF-03 and the project creation workflow.

## Current Issues

### 1. Project Creation Trigger Fails When `missing_important_info` Stuck on “Yes”
- **Description:** Deals remain in Quote Review because WF-03 keeps flagging missing data even after associations are fixed.
- **Impact:** Project objects are not created; approval phase cannot start.
- **Status:** Open – commonly occurs when sales re-associate contacts but forget to re-run WF-03.
- **Resolution:** Automate a stage toggle (e.g. move to Proposal Sent then back to Quote Review) or manually re-enrol WF-03 via HubSpot’s workflow UI; confirm the flag resets before proceeding.

### 2. Consultant URLs Not Regenerated After Recruiting Stage Change
- **Description:** WF-01 does not fire when recruiting stages are renamed or deals skip intermediate stages, leaving the sales deal without `assign_consultant_to_a_new_sales_deal`.
- **Impact:** Consultant wizard loads with empty parameters; WF-06 cannot attach the consultant.
- **Status:** Open – update WF-01 enrollment criteria to include new stage IDs and re-run for affected deals.
- **Resolution:** Refresh the stage mapping in WF-01, re-enrol the recruiting deal, and verify URLs repopulate.

### 3. Well Creation Link (`create_associate_well`) Points to Archived CMS URL
- **Description:** CMS route changed but WF-03 still writes the old link, leading to 404s.
- **Impact:** Users cannot create wells, blocking company association workflows.
- **Status:** Open – need to update WF-03 action to use new URL parameter.
- **Resolution:** Update workflow action with latest URL, republish CMS modules, and test well creation end-to-end.

## Resolved Issues

_None logged yet._

_Last updated: 2025-09-18._
