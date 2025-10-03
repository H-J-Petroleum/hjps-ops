#!/usr/bin/env python3
"""Generic phase verification script for timesheet process documentation.

Validates that workflows, CMS assets, and property mappings documented in
phase traces exist in the exported HubSpot data.

Usage examples:

    # Verify Foundations (default configuration)
    analysis/timesheet_process/shared/verification/verify_phase.py --phase foundation

    # Verify another phase with custom paths
    analysis/timesheet_process/shared/verification/verify_phase.py         --trace analysis/timesheet_process/phases/02-timesheet-creation/docs/TRACE.md         --phase-dir analysis/timesheet_process/phases/02-timesheet-creation
"""
from __future__ import annotations

import argparse
import json
import re
import sys
from datetime import datetime, UTC
from pathlib import Path
from typing import Dict, Iterable, List, Set

PROJ_ROOT = Path(__file__).resolve().parents[4]
DEFAULT_WORKFLOW_DIR = PROJ_ROOT / "data/raw/workflows"
DEFAULT_SCHEMA_DIR = PROJ_ROOT / "data/raw/ai-context/ai-context-export/data-model"
DEFAULT_CMS_MODULE_DIR = PROJ_ROOT / "data/raw/hubspot-cms-assets/Timesheets-Theme/modules"
DEFAULT_CMS_FORMS_PATH = PROJ_ROOT / "data/raw/hubspot-cms-api/forms/cms_forms_data.json"

PHASES = {
    "foundation": {
        "trace": PROJ_ROOT / "analysis/timesheet_process/phases/01-foundation/docs/FOUNDATIONS-TRACE.md",
        "phase_dir": PROJ_ROOT / "analysis/timesheet_process/phases/01-foundation",
        "log_dir": PROJ_ROOT / "analysis/timesheet_process/phases/01-foundation/verification/logs",
    },
    "timesheet_creation": {
        "trace": PROJ_ROOT / "analysis/timesheet_process/phases/02-timesheet-creation/docs/TRACE.md",
        "phase_dir": PROJ_ROOT / "analysis/timesheet_process/phases/02-timesheet-creation",
        "log_dir": PROJ_ROOT / "analysis/timesheet_process/phases/02-timesheet-creation/verification/logs",
    },
    "approval": {
        "trace": PROJ_ROOT / "analysis/timesheet_process/phases/03-approval/docs/TRACE.md",
        "phase_dir": PROJ_ROOT / "analysis/timesheet_process/phases/03-approval",
        "log_dir": PROJ_ROOT / "analysis/timesheet_process/phases/03-approval/verification/logs",
    },
    "billing": {
        "trace": PROJ_ROOT / "analysis/timesheet_process/phases/04-billing/docs/TRACE.md",
        "phase_dir": PROJ_ROOT / "analysis/timesheet_process/phases/04-billing",
        "log_dir": PROJ_ROOT / "analysis/timesheet_process/phases/04-billing/verification/logs",
    },
}




# Simple cache for schema files so we do not reload repeatedly
_SCHEMA_CACHE: Dict[str, Set[str]] = {}
_SCHEMA_PATH_CACHE: Dict[str, Path | None] = {}


def load_json(path: Path) -> dict:
    with path.open(encoding="utf-8") as f:
        return json.load(f)


def gather_trace_workflow_ids(trace_path: Path) -> Set[str]:
    pattern = re.compile(r"\b(\d{6,})\b")
    trace_text = trace_path.read_text(encoding="utf-8")
    # Collect workflow ids referenced in HubSpot URLs so we can ignore
    portal_ids = {match.group(1) for match in re.finditer(r"workflows/(\d+)/", trace_text)}
    workflow_ids: Set[str] = set()
    for line in trace_text.splitlines():
        line_lower = line.lower()
        if "WF-" in line or "Workflow" in line or (re.search(r"\(\d{6,}\)", line) and "module" not in line_lower and "form" not in line_lower):
            for match in pattern.findall(line):
                if match in portal_ids:
                    continue
                if f"hjpetro-{match}" in line:  # avoid portal number references
                    continue
                if 'module' in line_lower or 'form' in line_lower:
                    continue
                workflow_ids.add(match)
    return workflow_ids


def check_workflows(workflow_ids: Iterable[str], workflow_dir: Path) -> List[str]:
    discrepancies: List[str] = []
    for wf_id in sorted(set(workflow_ids)):
        candidates = [
            workflow_dir / f"v4-flow-{wf_id}.json",
            workflow_dir / f"v4-workflow-{wf_id}.json",
            workflow_dir / f"workflow-{wf_id}-v4.json",
            workflow_dir / f"workflow-{wf_id}.json",
        ]
        if not any(path.exists() for path in candidates):
            discrepancies.append(f"Workflow {wf_id} missing export file.")
    return discrepancies


def load_asset_inventories(phase_dir: Path) -> List[dict]:
    inventories: List[dict] = []
    for path in phase_dir.glob("**/assets/asset-inventory.json"):
        try:
            inventories.append(load_json(path))
        except Exception as exc:  # pragma: no cover - logging only
            inventories.append({"__error__": f"Failed to load {path}: {exc}"})
    return inventories


def check_cms_assets(inventories: Iterable[dict], module_dir: Path, forms_path: Path) -> List[str]:
    discrepancies: List[str] = []
    form_names: Set[str] = set()
    if forms_path.exists():
        forms_json = load_json(forms_path)
        results = forms_json.get("results", [])
        for entry in results:
            if isinstance(entry, dict):
                name = entry.get("name")
                if name:
                    form_names.add(name)
    else:
        discrepancies.append("CMS forms export missing; cannot validate forms.")

    for inventory in inventories:
        if "__error__" in inventory:
            discrepancies.append(inventory["__error__"])
            continue
        for module in inventory.get("modules", []):
            name = module.get("name")
            if not name:
                continue
            if not (module_dir / name).exists():
                discrepancies.append(f"CMS module missing: {name}")
        for form in inventory.get("forms", []):
            name = form.get("name")
            if not name or not form_names:
                continue
            if name not in form_names:
                discrepancies.append(f"Form not found in export: {name}")
    return discrepancies


def find_schema_path(obj_key: str, schema_dir: Path) -> Path | None:
    key = obj_key.lower()
    if key in _SCHEMA_PATH_CACHE:
        return _SCHEMA_PATH_CACHE[key]

    known_map = {
        "deal": "deals_schema.json",
        "deals": "deals_schema.json",
        "company": "companies_schema.json",
        "contact": "contacts_schema.json",
        "contacts": "contacts_schema.json",
        "hj_projects": "hj_projects-schema-2-26103074.json",
        "hj_consultants": "hj_consultants-schema-2-26103040.json",
        "hj_wells": "hj_wells-schema-2-26102958.json",
        "hj_approvals": "hj_approvals-schema-2-26103010.json",
    }
    if key in known_map:
        candidate = schema_dir / known_map[key]
        _SCHEMA_PATH_CACHE[key] = candidate if candidate.exists() else None
        return _SCHEMA_PATH_CACHE[key]

    # Fallback: search for filenames containing the key
    for path in schema_dir.glob("*.json"):
        name = path.name.lower()
        if key in name or f"{key}_schema" in name or key.rstrip('s') in name:
            _SCHEMA_PATH_CACHE[key] = path
            return path

    _SCHEMA_PATH_CACHE[key] = None
    return None


def get_schema_properties(obj_key: str, schema_dir: Path) -> Set[str]:
    obj_key = obj_key.lower()
    if obj_key in _SCHEMA_CACHE:
        return _SCHEMA_CACHE[obj_key]

    schema_path = find_schema_path(obj_key, schema_dir)
    props: Set[str] = set()
    if schema_path and schema_path.exists():
        schema_json = load_json(schema_path)
        for prop in schema_json.get("properties", []):
            name = prop.get("name")
            if name:
                props.add(name)
        for prop in schema_json.get("schema", {}).get("results", []):
            name = prop.get("name")
            if name:
                props.add(name)
    _SCHEMA_CACHE[obj_key] = props
    return props


def extract_properties_from_mapping(path: Path) -> Dict[str, Set[str]]:
    mapping: Dict[str, Set[str]] = {}
    data = load_json(path)
    if isinstance(data, dict) and "objects" in data:
        for obj, props in data["objects"].items():
            mapping.setdefault(obj, set()).update(props.keys())
    return mapping


def check_properties(phase_dir: Path, schema_dir: Path) -> List[str]:
    discrepancies: List[str] = []
    for mapping_path in phase_dir.glob("**/properties/property-mapping.json"):
        mapping = extract_properties_from_mapping(mapping_path)
        for obj_key, props in mapping.items():
            schema_props = get_schema_properties(obj_key, schema_dir)
            if not schema_props:
                discrepancies.append(
                    f"No schema export found for object '{obj_key}' referenced in {mapping_path}"
                )
                continue
            missing = sorted(p for p in props if p not in schema_props)
            if missing:
                discrepancies.append(
                    f"Properties missing in schema for {obj_key}: {', '.join(missing)} (source: {mapping_path})"
                )
    return discrepancies


def write_log(log_dir: Path, workflow_ids: Iterable[str], workflow_issues: Iterable[str],
              cms_issues: Iterable[str], property_issues: Iterable[str]) -> Path:
    log_dir.mkdir(parents=True, exist_ok=True)
    timestamp = datetime.now(UTC).strftime("%Y%m%dT%H%M%SZ")
    log_path = log_dir / f"phase-verification-{timestamp}.md"
    workflow_ids_sorted = ", ".join(sorted(set(workflow_ids))) or "None"

    lines = [f"# Phase Verification Log ({timestamp})\n"]
    lines.append("## Workflow Check\n")
    lines.append(f"Workflows referenced in trace: {workflow_ids_sorted}\n")
    if workflow_issues:
        lines.append("### Issues\n")
        lines.extend(f"- {issue}\n" for issue in workflow_issues)
    else:
        lines.append("All referenced workflows found.\n")

    lines.append("\n## CMS Asset Check\n")
    if cms_issues:
        lines.append("### Issues\n")
        lines.extend(f"- {issue}\n" for issue in cms_issues)
    else:
        lines.append("All referenced modules/forms located in exports.\n")

    lines.append("\n## Property Schema Check\n")
    if property_issues:
        lines.append("### Issues\n")
        lines.extend(f"- {issue}\n" for issue in property_issues)
    else:
        lines.append("All properties from property-mapping files found in schema exports.\n")

    lines.append("\n---\n")
    if workflow_issues or cms_issues or property_issues:
        lines.append("Verification completed with discrepancies. See issues above.\n")
    else:
        lines.append("Verification completed successfully.\n")

    log_path.write_text("".join(lines), encoding="utf-8")
    return log_path


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Verify phase documentation against HubSpot exports")
    parser.add_argument("--phase", choices=PHASES.keys(), help="Predefined phase to verify")
    parser.add_argument("--trace", type=Path, help="Path to trace markdown file")
    parser.add_argument("--phase-dir", type=Path, help="Path to phase directory (contains assets/properties)")
    parser.add_argument("--log-dir", type=Path, help="Directory to write verification logs")
    parser.add_argument("--workflow-dir", type=Path, default=DEFAULT_WORKFLOW_DIR)
    parser.add_argument("--schema-dir", type=Path, default=DEFAULT_SCHEMA_DIR)
    parser.add_argument("--cms-modules-dir", type=Path, default=DEFAULT_CMS_MODULE_DIR)
    parser.add_argument("--cms-forms", type=Path, default=DEFAULT_CMS_FORMS_PATH)
    return parser.parse_args()


def main() -> int:
    args = parse_args()

    config: dict = {}
    if args.phase:
        config.update(PHASES[args.phase])
    if args.trace:
        config["trace"] = PROJ_ROOT / args.trace if not args.trace.is_absolute() else args.trace
    if args.phase_dir:
        config["phase_dir"] = PROJ_ROOT / args.phase_dir if not args.phase_dir.is_absolute() else args.phase_dir
    if args.log_dir:
        config["log_dir"] = PROJ_ROOT / args.log_dir if not args.log_dir.is_absolute() else args.log_dir

    trace_path = config.get("trace")
    phase_dir = config.get("phase_dir")
    log_dir = config.get("log_dir") or (phase_dir / "verification/logs" if phase_dir else PROJ_ROOT)

    if not trace_path or not phase_dir:
        print("Trace path and phase directory must be specified (either via --phase or explicit arguments)", file=sys.stderr)
        return 2

    workflow_ids = gather_trace_workflow_ids(trace_path)
    if args.phase in {"approval", "billing"} and not workflow_ids:
        print("Warning: no workflow IDs detected in trace; ensure the JSON source includes workflow references.")
    if args.phase in {"approval", "billing"} and not workflow_ids:
        print("No workflow ids found in trace -- ensure trace is populated before running verification.")

    workflow_issues = check_workflows(workflow_ids, args.workflow_dir)
    cms_issues = check_cms_assets(load_asset_inventories(phase_dir), args.cms_modules_dir, args.cms_forms)
    property_issues = check_properties(phase_dir, args.schema_dir)

    log_path = write_log(log_dir, workflow_ids, workflow_issues, cms_issues, property_issues)
    print(f"Verification log written to {log_path.relative_to(PROJ_ROOT)}")
    if workflow_issues or cms_issues or property_issues:
        print("Discrepancies detected. See log for details.")
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())




