# Project Configuration Workflow Documentation

## Workflow Sequence

### 01. Update Recruiting Deal (`567275018`)
- **Trigger:** Recruiting pipeline deal enters qualified stages.
- **Actions:** Copy consultant metadata to deal, generate consultant/assignment URLs, build scope creation button (`scope_of_work_and_pricing`), set helper flags for conflict checks.
- **Outcome:** Deal is primed for handoff to the sales pipeline with consultant context and scope link intact.

### 03. Update Sales Deal & Create Custom Project Object (`567293814`)
- **Trigger:** Sales deal enters Quote Review or Closed Won.
- **Actions:** Validate required associations, enforce conflict checks, copy customer/operator/owner data, prepare well creation link, set `missing_important_info` flag.
- **Outcome:** Successful runs prepare the deal for project creation; failures roll back stage and log remediation notes.

### Project Creation Workflow (Workflow Configuration folder)
- **Trigger:** Internal event once WF-03 completes without errors.
- **Actions:** Create `hj_projects` record, copy validated fields, establish project ↔ deal/company/contact associations.
- **Outcome:** Active project record with complete metadata ready for approvals.

## Branching Logic
- WF-03 uses multiple LIST_BRANCH nodes to separate failure modes (missing customer, missing operator, missing approver, missing MSA). Each branch writes a specific note indicating what to fix.

## Error Handling
- **Missing association:** Stage reset + error note; requires CRM update and re-enrol.
- **Consultant conflict:** WF-03 instructs users to pick a different approver contact; prevents duplicate roles.
- **Project creation failure:** Monitor HubSpot workflow logs for custom code failures; re-run once deal validation passes.

_Last updated: 2025-09-18._
