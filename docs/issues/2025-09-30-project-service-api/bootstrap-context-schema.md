# Bootstrap Context Schema (Draft)

Proposed structure for `bootstrap-project-suite.mjs` master context JSON. All sections honour a top-level `dryRun` flag; individual stage toggles can override.

```json
{
  "dryRun": true,
  "stages": {
    "seedCompany": true,
    "seedSalesDeal": true,
    "seedConsultant": true,
    "createProject": true,
    "assignConsultants": true,
    "createService": true,
    "assignService": true,
    "createScope": true,
    "collectSnapshots": true
  },
  "company": {
    "customer": {
      "companyId": "12006423589",
      "properties": { "name": "Vital Energy", "msa_terms": "Net 30", "hj_taxable": "N" }
    },
    "operator": {
      "companyId": "12006423589",
      "properties": { ... }
    }
  },
  "salesDeal": {
    "dealId": "16647461296",
    "properties": { ... },
    "associations": {
      "customer": [{ "companyId": "12006423589", "associationTypeId": 207 }],
      "operator": [{ "companyId": "12006423589", "associationTypeId": 205 }],
      "contacts": [
        { "contactId": "6503", "associationTypeId": 20 },
        { "contactId": "437851", "associationTypeId": 19 }
      ]
    }
  },
  "consultant": {
    "contactId": "299151",
    "properties": { ... },
    "recruitingDeal": { "dealId": "13341510837", "associationTypeId": 4 }
  },
  "project": {
    "projectId": null,
    "projectName": "Vital - Drilling Construction Supervisor (Charlie Replacement)",
    "skipIfExists": true
  },
  "projectConsultants": {
    "consultants": ["299151"],
    "updateContactProperties": true
  },
  "service": {
    "properties": { ... },
    "dealId": "16647461296"
  },
  "serviceAssociation": {
    "dealId": "16647461296",
    "serviceIds": ["12767572791"]
  },
  "scope": {
    "properties": { ... }
  },
  "snapshot": {
    "upstreamRequest": { ... },
    "projectContextRequest": { ... }
  }
}
```

Notes:
- `company.operator` may reuse customer data when IDs match; orchestrator should detect and skip duplicate seeding.
- `project.projectId` optional; if omitted, `create-project.mjs` generates ID.
- `service.serviceIds` optional; orchestrator should default to newly created service if none supplied.
- Snapshot section mirrors inputs for `collect-upstream-context.mjs` / `collect-project-service-context.mjs`.
