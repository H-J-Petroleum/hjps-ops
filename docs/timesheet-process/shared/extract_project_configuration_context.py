#!/usr/bin/env python3
"""Extract enriched context for the project_configuration subprocess."""

from __future__ import annotations

import json
from collections import defaultdict
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Any

REPO_ROOT = Path(__file__).resolve().parents[3]
DATA_ROOT = REPO_ROOT / "data" / "raw"
SCHEMA_DIR = DATA_ROOT / "ai-context" / "ai-context-export" / "data-model"
WORKFLOW_DIR = DATA_ROOT / "workflows"
OUTPUT_PATH = (
    REPO_ROOT
    / "analysis"
    / "timesheet_process"
    / "01_foundation"
    / "project_configuration"
    / "generated"
    / "project-configuration-context.md"
)

ASSOCIATION_OBJECT_MAP = {
    "0-1": "contacts",
    "0-2": "companies",
    "0-3": "deals",
    "0-6": "quotes",
    "0-18": "communications",
    "0-27": "tasks",
    "0-46": "notes",
    "0-47": "meetings",
    "0-48": "calls",
    "0-49": "marketing emails",
    "0-51": "conversations",
    "0-116": "postal mail",
    "2-26103010": "hj_approvals",
    "2-26103040": "hj_services",
    "2-26103058": "hj_field_tickets",
    "2-26103072": "hj_consultants",
    "2-26103074": "hj_projects",
    "2-26102958": "hj_wells",
    "2-26173281": "hj_timesheets",
}

WORKFLOW_IDS = {
    "567500453": "Consultant Approval Request",
    "567466561": "Approval Reminder 1",
    "567463273": "Approval Reminder 3",
    "1680618036": "Customer Approval Response",
    "1682422902": "H&J Approval Response",
}


def load_schema() -> Dict[str, Any]:
    matches = sorted(SCHEMA_DIR.glob("hj_projects-schema-*.json"), reverse=True)
    if not matches:
        raise FileNotFoundError("No hj_projects schema found under data/raw/ai-context/ai-context-export/data-model")
    return json.loads(matches[0].read_text(encoding="utf-8"))


def build_property_tables(schema: Dict[str, Any]) -> List[str]:
    required = set(schema.get("requiredProperties", []))
    custom_lines = ["### Custom Project Properties", "", "| Property | Label | Type | Required | Description |", "|---|---|---|---|---|"]
    core_lines = ["### HubSpot Core Properties", "", "| Property | Label | Type | Description |", "|---|---|---|---|"]

    for prop in sorted(schema.get("properties", []), key=lambda x: x.get("name", "")):
        name = prop.get("name", "")
        label = prop.get("label", "")
        ptype = f"{prop.get('type', '')}/{prop.get('fieldType', '')}".strip("/")
        desc = (prop.get("description") or "").replace("\n", " ")
        if name.startswith("hj_"):
            required_flag = "✅" if name in required else ""
            custom_lines.append(f"| `{name}` | {label} | {ptype} | {required_flag} | {desc} |")
        else:
            core_lines.append(f"| `{name}` | {label} | {ptype} | {desc} |")

    if len(custom_lines) == 4:
        custom_lines.append("| _(none)_ | | | | |")
    if len(core_lines) == 4:
        core_lines.append("| _(none)_ | | | |")

    return ["\n".join(custom_lines), "\n".join(core_lines)]


def build_association_table(schema: Dict[str, Any]) -> str:
    lines = ["### Object Associations", "", "| Association | Target Object | Association ID | Cardinality |", "|---|---|---|---|"]
    for assoc in sorted(schema.get("associations", []), key=lambda x: x.get("id", "")):
        target_code = assoc.get("toObjectTypeId")
        target = ASSOCIATION_OBJECT_MAP.get(target_code, target_code)
        if target in {"contacts", "companies", "deals", "hj_approvals", "hj_consultants", "hj_timesheets", "hj_services", "hj_field_tickets", "hj_wells"} or assoc.get("name", "").startswith("project_"):
            lines.append(
                f"| `{assoc.get('name')}` | {target} | {assoc.get('id')} | {assoc.get('cardinality')} |"
            )
    if len(lines) == 4:
        lines.append("| _(none)_ | | | |")
    return "\n".join(lines)


def load_workflow(workflow_id: str) -> Dict[str, Any] | None:
    candidates = list(WORKFLOW_DIR.glob(f"*{workflow_id}*.json"))
    if not candidates:
        return None
    # prefer files named workflow-... over v4-flow- to capture enriched metadata
    candidates.sort(key=lambda p: ("workflow-" not in p.name, p.name))
    return json.loads(candidates[0].read_text(encoding="utf-8"))


def summarize_action(action: Dict[str, Any]) -> str:
    action_id = action.get("actionId") or action.get("actionGuid") or action.get("id")
    label = action.get("name") or action.get("type")
    atype = action.get("type")
    details = []
    if atype == "SEND_EMAIL":
        email_id = action.get("emailId") or action.get("email")
        if email_id:
            details.append(f"emailId={email_id}")
        if action.get("recipientType"):
            details.append(f"recipient={action['recipientType']}")
    elif atype == "SET_PROPERTY":
        details.append(f"property={action.get('propertyName')}")
        details.append(f"value={action.get('propertyValue')}")
    elif atype == "LIST_BRANCH":
        branches = action.get("branches") or []
        details.append(f"branches={len(branches)}")
    elif atype == "DELAY_UNTIL":
        details.append(f"delay={action.get('delayMilliseconds')}ms")
    elif atype == "WEBHOOK":
        details.append(action.get("webhookUrl", ""))
    detail_str = ", ".join(filter(None, details))
    return f"- `{action_id}` · {label} ({atype}){(' → ' + detail_str) if detail_str else ''}"


def build_workflow_section(workflow_id: str, label: str) -> str:
    data = load_workflow(workflow_id)
    if not data:
        return f"### {label}\n- ⚠️ Workflow {workflow_id} not found in data/raw/workflows"

    actions = data.get("actions", [])
    lines = [f"### {label}", "", f"- **Workflow ID:** `{workflow_id}`", f"- **Name:** {data.get('name', 'N/A')}", f"- **Object Type:** {data.get('objectType', 'unknown')} ({data.get('type', '')})", f"- **Total Actions:** {len(actions)}", "", "**Actions:**"]
    if actions:
        for action in actions:
            lines.append(summarize_action(action))
    else:
        lines.append("- (no actions found in export)")
    return "\n".join(lines)


def build_module_summary() -> str:
    modules_dir = DATA_ROOT / "themes" / "Timesheets-Theme" / "modules"
    if not modules_dir.exists():
        return "### CMS Modules\n- ⚠️ Timesheets-Theme modules directory not found"

    interesting = []
    for module in modules_dir.iterdir():
        if not module.is_dir():
            continue
        lowered = module.name.lower()
        if not any(token in lowered for token in ("approval", "project", "timesheet")):
            continue

        meta_path = module / "meta.json"
        fields_path = module / "fields.json"

        label = module.name
        description = ""
        if meta_path.exists():
            try:
                meta_data = json.loads(meta_path.read_text(encoding="utf-8"))
                description = meta_data.get("label") or meta_data.get("description") or ""
            except json.JSONDecodeError:
                description = "(meta.json unreadable)"

        field_count = "?"
        sample_fields: List[str] = []
        if fields_path.exists():
            try:
                fields_data = json.loads(fields_path.read_text(encoding="utf-8"))
                if isinstance(fields_data, list):
                    field_count = len(fields_data)
                    sample_fields = [f.get("name", "") for f in fields_data if isinstance(f, dict)]
                elif isinstance(fields_data, dict):
                    entries = fields_data.get("fields") or []
                    if isinstance(entries, list):
                        field_count = len(entries)
                        sample_fields = [f.get("name", "") for f in entries if isinstance(f, dict)]
            except json.JSONDecodeError:
                field_count = "?"

        fields_preview = ", ".join(name for name in sample_fields[:5] if name)
        interesting.append((label, description, field_count, fields_preview))

    lines = [
        "### CMS Modules",
        "",
        "| Module | Label/Description | Field count | Key fields |",
        "|---|---|---|---|",
    ]
    for name, desc, count, preview in sorted(interesting):
        display_desc = desc or "(no label)"
        display_preview = preview or "—"
        lines.append(f"| `{name}` | {display_desc} | {count} | {display_preview} |")
    if len(lines) == 4:
        lines.append("| _(none found)_ | | | |")
    return "\n".join(lines)


def main() -> None:
    schema = load_schema()
    property_sections = build_property_tables(schema)
    parts = [
        "# Project Configuration Context Extract",
        f"_Generated: {datetime.now().isoformat()}_",
        "",
        *property_sections,
        "",
        build_association_table(schema),
        "",
        build_module_summary(),
        "",
        "## Workflows",
    ]
    for wf_id, label in WORKFLOW_IDS.items():
        parts.append("")
        parts.append(build_workflow_section(wf_id, label))

    OUTPUT_PATH.write_text("\n".join(parts), encoding="utf-8")
    print(f"Context extract written to {OUTPUT_PATH.relative_to(REPO_ROOT)}")


if __name__ == "__main__":
    main()
