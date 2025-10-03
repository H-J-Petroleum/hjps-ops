# Implementation Plan

## Shared Constraints
- All scripts must read a `.hubspot-token` file (bearer) and a context JSON describing source records.
- Use `fetch`-based helper mirroring `run-approval-request.mjs` for consistency; include retry surfaces for association PUTs.
- Persist a `*-run-<timestamp>.json` summary per execution.

## 1. `create-project.mjs`
**Purpose:** Replace WF-03 custom code by creating an HJ Project (`2-26103074`), associating it to the sales deal (`associationTypeId 197`), customer (`207`), operator (`205`), and stamping correlation properties back on the deal.

**Inputs:**
- Deal record (id, name, owner, `hj_customer_*`, `hj_operator_*`, approver info, `terms`, `taxable`, `class`).
- Optional override for generated project ID/name.

**Outputs:**
- New project object ID + project ID value.
- Association confirmation payloads (deal, customer, operator).
- Deal patch response logging new `project_object_id`, `project_unique_id`.

## 2. `assign-consultants-to-project.mjs`
**Purpose:** Establish the consultant→project relationship (associationTypeId 209/210) and keep contact staging fields in sync (e.g., `hj_notify_project_*`).

**Inputs:**
- Project object ID + `hj_project_id`.
- Array of consultant contact IDs (or emails resolved to IDs).
- Optional flag to patch contact properties after association.

**Outputs:**
- Association results per consultant.
- Contact patch outcomes (if executed).

## 3. `create-service.mjs`
**Purpose:** Create an HJ Service (`2-26102982`) with pricing metadata so SOW + timesheets have structured service references.

**Inputs:**
- Service definition (name, SKU, billing frequency, consultant/H&J price fields).
- Optional deal context (`hs_object_id`) for associationTypeId 145/146.

**Outputs:**
- Service object ID, association confirmation (if deal provided).
- Summary of pricing set.

## 4. `assign-service-to-deal.mjs`
**Purpose:** Attach existing HJ Service records to a sales deal (or recruiting deal) when only association updates are required.

**Inputs:**
- Deal ID.
- List of HJ Service object IDs.
- Optional label/association type override (default `hj_services_to_deal`, associationTypeId 146).

**Outputs:**
- Association results (success/failure per service).

## 5. `create-scope-of-work.mjs`
**Purpose:** Create HJ Consultant (`2-26103040`) entries representing approved scopes (pricing per consultant + project).

**Inputs:**
- Consultant contact ID & email.
- Project identifiers (`hj_project_id`, `hj_project_name`).
- Service/job metadata (`job_service`, `well`, billing frequency, per-unit pricing, H&J margin fields).
- Source deal IDs (`sales_deal_id`, `consultant_deal_id`, `payment_deal_id`).
- Optional approval tracking (`hj_unique_approval_request`).

**Outputs:**
- New HJ Consultant object ID.
- Summary echo of pricing + scope metadata.

## Supporting Assets
- `/data/project-service-context-*.json` – curated examples for dry runs captured via `collect-project-service-context.mjs`.
- `/docs/associations.md` – quick reference for type IDs (project↔deal/customer/operator/consultant, service↔deal, etc.).

## Validation Strategy
- Use sandbox context where possible; otherwise DRY-run with `--dry-run` flag (to be added) that logs intended payloads without POST/PUT.
- Unit test with Jest (optional future work) by stubbing fetch; for now rely on manual context-driven execution.
