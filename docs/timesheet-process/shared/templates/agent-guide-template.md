
You are an expert technical writer creating AI agent guidance documentation.

Generate a comprehensive agent.md file for the project_configuration sub-process in the 01_foundation phase.

Process Knowledge:
- Purpose: Create and configure projects for timesheet management (Foundations phase)
- Key Objects: hj_projects, contacts, companies, deals
- Key Properties: hj_project_name, hj_approver_email, hj_approver_is, hj_project_status
- Workflows: 01. Update Recruiting Deal (567275018), 03. Update Sales Deal & Create Custom Project Object (567293814)
- Forms (if any): list form IDs tied to these workflows (e.g., `b682c714-e395-4677-bbfb-1a32fad5f04b`)

Reference the phases/03-approval/agent.md as a template. Create comprehensive agent guidance that includes:

1. Quick Start (30 seconds) - Primary entry points, critical dependencies, common issues
2. Investigation Checklist (5 minutes) - Before making changes, when debugging
3. Critical Paths (10 minutes) - Happy path, error paths, edge cases
4. Data Dependencies (15 minutes) - Input/output objects, cross-references
5. Common Tasks (30 minutes) - Debug issues, add features, modify logic
6. Agent-Specific Notes - Memory triggers, common mistakes, success patterns
7. Asset Quick Reference - Workflows, forms, modules, objects

Make it practical, actionable, and comprehensive, grounding every section in the workflow JSON exports and schema data available in `data/raw/`.
