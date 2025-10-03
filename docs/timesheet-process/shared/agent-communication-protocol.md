# Agent Communication Protocol

Standard communication guidelines for coordinating documentation agents and orchestration scripts.

## Protocol Overview
- Ensure every agent run reports status, requests data, and shares outputs in a predictable format.
- Support both real-time orchestration (PowerShell scripts) and offline file exchange for auditability.
- Keep messages grounded in the shared source of truth (`analysis/timesheet_process/shared/source/phases.json`).

## Communication Channels
1. **Status channel** – periodic updates about progress (`running`, `completed`, `failed`, `blocked`).
2. **Data channel** – structured payloads (workflows, modules, forms, schema fragments).
3. **Event channel** – broadcast notable events (e.g., generation complete, verification failed).
4. **Request channel** – ask other agents or orchestration tools for data or action.
5. **Response channel** – deliver responses tied to request IDs with success or error metadata.

## Message Types

### Status
```json
{
  "type": "status",
  "agent": "project_configuration",
  "phase": "01-foundation",
  "status": "running",
  "timestamp": "2025-09-19T15:30:00Z",
  "message": "Regenerating foundational docs",
  "progress": 65
}
```

### Data
```json
{
  "type": "data",
  "agent": "asset_discovery",
  "phase": "02-timesheet-creation",
  "data_type": "workflow_assets",
  "data": {
    "workflows": ["workflow-567497868-v4.json"],
    "modules": ["hjp-insert-timesheet-01.module"],
    "forms": ["f2b89ea4-cae8-42ad-845b-ff5a25dc299a"]
  },
  "timestamp": "2025-09-19T15:30:00Z"
}
```

### Event
```json
{
  "type": "event",
  "agent": "project_configuration",
  "phase": "01-foundation",
  "event_type": "completion",
  "event_data": {
    "generated_docs": [
      "analysis/timesheet_process/phases/01-foundation/docs/STATUS.md",
      "analysis/timesheet_process/phases/01-foundation/docs/FOUNDATIONS-TRACE.md"
    ],
    "source": "scripts/agent-core/generate-phase-docs.js"
  },
  "timestamp": "2025-09-19T15:31:00Z"
}
```

### Request / Response
```json
{
  "type": "request",
  "from_agent": "workflow_configuration",
  "to_agent": "project_configuration",
  "phase": "01-foundation",
  "request_type": "data",
  "request_data": {
    "required": "project_schema",
    "format": "json"
  },
  "request_id": "req_12345",
  "timestamp": "2025-09-19T15:32:00Z"
}
```
```json
{
  "type": "response",
  "from_agent": "project_configuration",
  "to_agent": "workflow_configuration",
  "phase": "01-foundation",
  "request_id": "req_12345",
  "response_data": {
    "project_schema": "analysis/timesheet_process/shared/source/phases.json",
    "status": "success"
  },
  "timestamp": "2025-09-19T15:32:10Z"
}
```

## Implementation Options
- **Message queues:** PowerShell queues or background jobs when real-time coordination is required.
- **File-based exchange:** JSON payloads stored under `analysis/timesheet_process/shared/agents/<phase>/` for reproducible audits.
- **Event broadcasting:** File-system watchers or Git hooks that trigger when generated docs or logs change.
- **Request/response pattern:** Synchronous shell calls with structured JSON output (preferred for generator + verification workflows).

## Responsibilities
- **Sending agent:** format message according to this protocol, include timestamps and context, handle retries gracefully.
- **Receiving agent:** validate structure, queue work in order received, acknowledge or respond quickly, handle malformed messages safely.
- **Orchestration framework:** route messages, monitor health, surface alerts when agents fail or stall, maintain long-term logs.

## Monitoring & Health Checks
- Poll `agent-status.json` files under `analysis/timesheet_process/shared/agents/` or run `scripts/agent-utilities/agent-status-monitor.ps1`.
- Validate message structure with `scripts/agent-core/agent-conflict-detector.psm1` when diagnosing issues.
- Track message latency and volume via periodic summaries written to `shared/agents/<phase>/logs/`.

## Error Handling
- Retries with exponential backoff for transient failures.
- Escalate to human operator after configurable retry thresholds.
- Preserve fallback communication (e.g., write-to-disk) if queues fail.
- Log corruption incidents and resend requests when checksum mismatches are detected.

## Metrics to Track
- Message volume per agent and channel.
- Average response times for requests.
- Error rates and retry counts.
- Throughput (messages processed per minute) during orchestration runs.

Keep this protocol in sync with the documentation generator and verification scripts so agents always share consistent data.