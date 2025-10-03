# Scope Management Workflow Sequence

| Step | Workflow | Trigger | HubSpot actions | Result |
| --- | --- | --- | --- | --- |
| 1 | WF-01 Update Recruiting Deal (Action 3) | Recruiting deal enters qualified stage | Writes the scope creation button (scope_of_work_and_pricing) with consultant/deal parameters | Consultant receives scope launch link |
| 2 | Consultant scope authoring flow | Consultant follows scope URL (prepare-consultants pages) | Captures pricing arrays and notes on contact/custom object fields (sof_*) | Scope request staged for approval |
| 3 | WF-09 Scope of Work - Approval (567402589) | Scope Approval form submitted | Updates HJ Consultant records, creates deal note, patches approver contact with view link | Approval decision recorded and shared |
