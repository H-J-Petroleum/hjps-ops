# Toolbox Standards

Defines the shared components ("toolbox") that every H&J Petroleum implementation must use across HubSpot, Frappe, and future services. The goal is to minimise tool sprawl, keep assets reusable, and make future migrations routine.

## Scope
- Stabilised HubSpot workflows on the Professional tier
- Frappe core application under development
- Agent automation, RAG pipelines, and supporting services

## Canonical Components
| Category | Component | Description | References |
| --- | --- | --- | --- |
| **Data contracts** | MariaDB schema registry | HubSpot exports mirrored to MariaDB (`hubspot_data`), including association labels and audit fields. Treat as the source of truth for DocTypes, workflows, and external APIs. | docs/technical/database-integration.md |
| | Property & workflow governance | Required properties, association labels, and validation scripts tracked in the Foundations improvement plan. | analysis/timesheet_process/phases/01-foundation/docs/IMPROVEMENT-PLAN.md |
| **Business logic** | Shared helper library | URL generation, validation, audit logging, redaction. Node wrappers use it inside HubSpot custom code; the Python package is imported by Frappe and future services. | analysis/timesheet_process/phases/01-foundation/docs/METHODS-COMPARISON.md |
| **UI/UX** | `hj-foundations-ui.css/js` kit | Shared CSS/JS bundle (buttons, tables, validation helpers) and UX checklist. Required for HubSpot modules, Frappe web views, and any new front-end. | analysis/timesheet_process/phases/01-foundation/docs/UI-UX-RECOMMENDATIONS.md |
| **Storage** | MinIO/S3 artifact helper | Upload + presign helper returning `s3://` URI and HTTPS link; used for approvals, exports, and AI artefacts. | docs/technical/database-integration.md |
| | LanceDB vector store | Default dense retrieval store, configured via `config/vector.config.json`. | config/vector.config.json |
| **AI runtime** | Router policy + tool decorator | Shared routing rules (`LOCAL_MAX_CTX`, `TAU`) and Pydantic-based tool decorator to keep validation consistent across runtimes. | docs/agent-system/vector_mastra_upgrade/local-runtime-checklist.md |
| | Hybrid RAG harness | Retrieval + (optional) reranker pipeline shared between HubSpot agents, Frappe services, and future APIs. | scripts/vector-ingest |
| **Testing & verification** | Agent verification + golden tests | Foundations verification scripts, Jest suites, and future eval harnesses collected under `docs/technical/testing-strategy.md`. | docs/technical/testing-strategy.md |
| **Deploy & environments** | HubSpot sandbox deploy beta | Leverage HubSpot's deploy-to-production flow when changes fall within supported asset types; document approval and rollback steps. | docs/processes/hubspot-deploy-beta.md |

## Platform Alignment
- **HubSpot (Professional tier)**
  - Use calculated properties + workflow custom code; no HubSpot Functions.
  - Call shared helpers instead of embedding HTML/logic in properties.
  - Track schema drift via the MariaDB exports and verification scripts.
  - Consume the design kit in CMS modules for consistent UI/UX.
- **Frappe core**
  - Map DocTypes to the MariaDB schema registry to keep parity with HubSpot.
  - Import the Python helper package for URL signing, validation, auditing, and redaction.
  - Serve assets through the shared CSS/JS bundle; avoid bespoke styling.
  - Leverage Frappe's RQ workers for background tasks; introduce external queues only when metrics warrant.
- **Future services (e.g., FastAPI)**
  - Reuse the same helper package, router policy, and tool decorator.
  - Surface REST contracts derived from the schema registry and Pydantic models.
  - Use the MinIO helper + LanceDB configuration by default; additional stores require approval.

## Metrics-Gated Additions
Only add the following components when observability or product metrics prove the need:
- **NATS / queue** – When p95 latency or task duration exceeds SLA.
- **Meilisearch / hybrid lexical** – When retrieval metrics show consistent misses on IDs/codes even after LanceDB tuning.
- **Qdrant / alternative vector DB** – When LanceDB throughput or recall cannot meet requirements.
- **Temporal / orchestration frameworks** – When workflow complexity exceeds what shared helpers and queues can handle.
- **Mastra expansions** – For customer-facing agent workflows; keep core reasoning in Python services.

## Usage & Governance
1. Reference this toolbox when planning new features or migrations.
2. Update the schema registry and shared helpers before changing any HubSpot property, Frappe DocType, or API contract.
3. Document new components in `docs/standards/toolbox.md` and justify them with metrics.
4. Keep verification scripts current; they certify that HubSpot, Frappe, and external services stay in sync.
5. During retros/migrations, audit implementations against this toolbox to prevent "custom lego" drift.

Future refinements should extend this document with component-specific runbooks (e.g., helper import samples, schema update workflows) as they are standardised.
