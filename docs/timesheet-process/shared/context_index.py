#!/usr/bin/env python3
"""Generate a consolidated index of timesheet process assets and related data."""

from __future__ import annotations

import argparse
import json
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Any


def iso_timestamp(ts: float) -> str:
    return datetime.fromtimestamp(ts).astimezone().isoformat()


def file_summary(path: Path, repo_root: Path) -> Dict[str, Any]:
    stat = path.stat()
    return {
        "name": path.name,
        "path": str(path.relative_to(repo_root)),
        "size": stat.st_size,
        "modified": iso_timestamp(stat.st_mtime),
    }


def summarize_directory(path: Path, repo_root: Path, include_files: bool = True) -> Dict[str, Any]:
    info: Dict[str, Any] = {
        "name": path.name,
        "path": str(path.relative_to(repo_root)),
        "subdirectories": [],
    }

    files: List[Dict[str, Any]] = []
    for child in sorted(path.iterdir(), key=lambda p: (p.is_file(), p.name.lower())):
        if child.is_dir():
            stat = child.stat()
            info["subdirectories"].append(
                {
                    "name": child.name,
                    "path": str(child.relative_to(repo_root)),
                    "file_count": sum(1 for _ in child.glob("**/*") if _.is_file()),
                    "modified": iso_timestamp(stat.st_mtime),
                }
            )
        elif include_files and child.is_file():
            files.append(file_summary(child, repo_root))

    if include_files:
        info["files"] = files

    return info


def gather_timesheet_process(timesheet_root: Path, repo_root: Path) -> List[Dict[str, Any]]:
    phases: List[Dict[str, Any]] = []
    for item in sorted(timesheet_root.iterdir(), key=lambda p: p.name.lower()):
        if item.is_dir() and item.name[0:2].isdigit():
            phase_info: Dict[str, Any] = summarize_directory(item, repo_root)
            phases.append(phase_info)
    return phases


def gather_shared_assets(shared_root: Path, repo_root: Path) -> Dict[str, Any]:
    shared_info = summarize_directory(shared_root, repo_root)

    # Highlight key shared references we expect other automations to consume
    highlights: Dict[str, List[Dict[str, Any]]] = {
        "python_tools": [],
        "powershell_tools": [],
        "guides": [],
    }

    for child in shared_root.iterdir():
        if child.suffix == ".py" and child.is_file():
            highlights["python_tools"].append(file_summary(child, repo_root))
        elif child.suffix in {".ps1", ".psm1"} and child.is_file():
            highlights["powershell_tools"].append(file_summary(child, repo_root))
        elif child.suffix in {".md", ".txt"} and child.is_file():
            highlights["guides"].append(file_summary(child, repo_root))

    shared_info["highlights"] = highlights
    return shared_info


def gather_data_sources(repo_root: Path) -> Dict[str, Any]:
    data_sources: Dict[str, Any] = {}

    schema_dir = repo_root / "data" / "raw" / "ai-context" / "ai-context-export" / "data-model"
    if schema_dir.exists():
        data_sources["schemas"] = [file_summary(path, repo_root) for path in sorted(schema_dir.glob("*.json"))]

    workflow_dir = repo_root / "data" / "raw" / "workflows"
    if workflow_dir.exists():
        data_sources["workflows"] = [file_summary(path, repo_root) for path in sorted(workflow_dir.glob("*.json"))]

    modules_dir = repo_root / "data" / "raw" / "themes" / "Timesheets-Theme" / "modules"
    if modules_dir.exists():
        module_infos: List[Dict[str, Any]] = []
        for module_path in sorted(modules_dir.iterdir()):
            if module_path.is_dir():
                stat = module_path.stat()
                module_infos.append(
                    {
                        "name": module_path.name,
                        "path": str(module_path.relative_to(repo_root)),
                        "file_count": sum(1 for _ in module_path.glob("**/*") if _.is_file()),
                        "modified": iso_timestamp(stat.st_mtime),
                    }
                )
        data_sources["modules"] = module_infos

    forms_dir = repo_root / "data" / "raw" / "ai-context" / "ai-context-export" / "forms"
    if forms_dir.exists():
        data_sources["forms"] = [file_summary(path, repo_root) for path in sorted(forms_dir.glob("*.json"))]

    return data_sources


def build_index() -> Dict[str, Any]:
    script_path = Path(__file__).resolve()
    shared_root = script_path.parent
    timesheet_root = shared_root.parent
    repo_root = timesheet_root.parent.parent

    index: Dict[str, Any] = {
        "generated_at": datetime.now().astimezone().isoformat(),
        "timesheet_root": str(timesheet_root.relative_to(repo_root)),
        "phases": gather_timesheet_process(timesheet_root, repo_root),
        "shared_assets": gather_shared_assets(shared_root, repo_root),
        "data_sources": gather_data_sources(repo_root),
    }

    additional_files = [
        timesheet_root / "PROCESS-FLOW-COMPLETE.md",
        timesheet_root / "STRUCTURE-STATUS-SUMMARY.md",
        timesheet_root / "README.md",
        timesheet_root / "CONTEXT-RESET-SUMMARY.md",
    ]
    index["key_documents"] = [file_summary(path, repo_root) for path in additional_files if path.exists()]

    return index


def main() -> None:
    parser = argparse.ArgumentParser(description="Generate an index for timesheet process assets.")
    parser.add_argument(
        "--output",
        type=Path,
        default=None,
        help="Optional output path for the generated JSON index (defaults to shared/context-index.json)",
    )
    parser.add_argument(
        "--pretty",
        action="store_true",
        help="Pretty-print JSON with indentation",
    )
    args = parser.parse_args()

    index = build_index()

    script_path = Path(__file__).resolve()
    default_output = script_path.parent / "context-index.json"
    output_path = args.output or default_output

    output_path.write_text(
        json.dumps(index, indent=2 if args.pretty else None, ensure_ascii=False),
        encoding="utf-8",
    )
    print(f"Context index written to {output_path}")


if __name__ == "__main__":
    main()

