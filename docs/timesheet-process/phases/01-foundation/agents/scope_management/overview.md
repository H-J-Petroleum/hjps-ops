# Scope Management Overview (Foundations)

Foundations owns the creation and approval of consultant Scopes of Work prior to timesheet usage.

## Objectives
1. Generate the scope creation URL immediately after consultant readiness is established.
2. Capture detailed scope submissions (rates, billing, comments) via the consultant-facing portal.
3. Route approvals to internal stakeholders and persist the decision on the project/deal records.

## HubSpot Components
- **Workflows:**
  - WF-01 (Action 3) – builds the scope creation URL/button on the recruiting deal (`scope_of_work_and_pricing`).
  - WF-04 (Scope cleanup) – clears scope properties when the deal leaves target stages.
  - WF-09 Scope of Work – Approval (`567402589`) – processes approval responses.
- **CMS flows:** `prepare-consultants-start`, `prepare-consultants-01`, `prepare-consultants-02`, `prepare-consultants-overview`.
- **Approval landing pages:** `approve-scope-of-work-01`, `approve-scope-of-work-02`.
- **Forms:** Consultant scope builder, Scope of Work Approval form (captures approval decision and comments).

## Process Summary
1. **URL Generation:** WF-01 writes `scope_of_work_and_pricing`, a button that carries deal/consultant context into the CMS flow.
2. **Scope Authoring:** Consultant completes the `prepare-consultants-*` sequence, producing pricing arrays and notes on the consultant contact/custom object.
3. **Approval Submission:** Approver receives the scope request, completes the approval form, triggering WF-09.
4. **Record Updates:** WF-09 pushes the decision, pricing, and notes back to HubSpot records (custom object + deal note) and exposes a view link for audit.

This folder documents the assets, properties, workflows, and open issues tied to scope creation and approval.
