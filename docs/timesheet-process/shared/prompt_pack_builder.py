#!/usr/bin/env python3
"""Build AI prompt packs for timesheet documentation deliverables."""

from __future__ import annotations

import argparse
import json
import textwrap
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List, Optional

DELIVERABLE_TEMPLATES: Dict[str, Dict[str, Any]] = {
    "agent": {
        "filename": "agent.md",
        "summary": "Generate actionable agent guidance for the subprocess, including mission, workflows, troubleshooting, and validation steps.",
        "style": "Structured operations guide with concise sections, bullet lists where appropriate, and implementation-focused tone.",
        "voice": "Expert HubSpot solutions engineer documenting for an internal AI agent team.",
        "checklist": [
            "Explain mission, boundaries, and success criteria for the agent.",
            "Map critical inputs, outputs, and dependencies using current schema references.",
            "Detail runbooks for common tasks (execution, debugging, hand-offs).",
            "Flag known risks, open issues, and validation steps before completion.",
            "Link to backend, frontend, workflow, and property docs relevant to this subprocess."
        ],
        "acceptance_tests": [
            "All referenced files exist at cited paths.",
            "Context-specific names (projects, approvals, etc.) reflect the latest schema data.",
            "No TODO placeholders remain."
        ],
        "system_prompt": "You are an AI documentation specialist producing an agent operations guide for the H&J Petroleum HubSpot timesheet system.",
        "user_prompt_template": textwrap.dedent(
            """
            Produce an updated `{deliverable}` for the `{phase_label}` ▸ `{subprocess_label}` subprocess.

            Use the context bundle below. When citing artifacts, reference them by relative path and describe how they inform the agent's responsibilities.

            ### Deliverable Requirements
            - Target path: `{target_path}`
            - Purpose: {summary}
            - Style: {style}
            - Checklist:
            {checklist_block}
            - Acceptance tests:
            {acceptance_block}

            ### Context Bundle
            {context_block}

            ### Output Expectations
            - Return polished Markdown ready to overwrite `{target_path}`.
            - Include sections for Mission, Primary Responsibilities, Inputs & Outputs, Key Workflows, Operational Playbooks, Validation & QA, Risks & Mitigations, and References.
            - Integrate data and terminology from the provided snippets without paraphrasing away critical IDs or property names.
            """
        ),
        "model_hint": "gpt-4.1 or claude-3.5-sonnet"
    },
    "implementation_guide": {
        "filename": "backend/implementation-guide.md",
        "summary": "Document backend implementation details for engineers, covering integrations, data flow, and testing guidance.",
        "style": "Technical implementation manual with explicit callouts for APIs, workflows, and validation steps.",
        "voice": "Principal engineer translating discovery notes into implementation-ready guidance.",
        "checklist": [
            "Summarize current architecture and HubSpot assets involved.",
            "Document data flow with emphasis on critical associations and property usage.",
            "Include setup or execution steps for scripts or APIs mentioned.",
            "List validation procedures and diagnostic scripts available via Codex CLI.",
            "Highlight open engineering risks or follow-up actions."
        ],
        "acceptance_tests": [
            "Every workflow or module mentioned maps to a file in the context bundle.",
            "Troubleshooting tips reference actual logs or scripts when applicable."
        ],
        "system_prompt": "You are an engineering technical writer producing backend implementation guidance for the timesheet system.",
        "user_prompt_template": textwrap.dedent(
            """
            Create an updated `{deliverable}` for `{phase_label}` ▸ `{subprocess_label}`.

            ### Deliverable Requirements
            - Target path: `{target_path}`
            - Purpose: {summary}
            - Style: {style}
            - Checklist:
            {checklist_block}
            - Acceptance tests:
            {acceptance_block}

            ### Context Bundle
            {context_block}

            ### Output Expectations
            - Produce detailed Markdown ready to overwrite `{target_path}`.
            - Include sections: Overview, HubSpot Assets, Data Flow, Execution Steps, Validation, Troubleshooting, Open Risks.
            - Reference relevant Python helpers or CLI workflows when applicable.
            """
        ),
        "model_hint": "gpt-4.1 or claude-3.5-sonnet"
    }
}

ROLE_MAP = {
    "overview.md": "process-flow",
    "agent.md": "process-flow",
    "asset": "asset",
    "assets": "asset",
    "backend": "back-end",
    "frontend": "front-end",
    "properties": "schema",
    "property": "schema",
    "workflow": "workflow",
    "workflows": "workflow",
    "issues": "issue",
    "logs": "logs",
    "context-index": "knowledge"
}

TEXTUAL_SUFFIXES = {
    ".md", ".txt", ".json", ".js", ".ts", ".ps1", ".psm1", ".py", ".yaml", ".yml",
}


def iso_timestamp(ts: float) -> str:
    return datetime.fromtimestamp(ts).astimezone().isoformat()


def infer_role(path: Path) -> str:
    name = path.name.lower()
    for key, role in ROLE_MAP.items():
        if key in name:
            return role
    # fall back to directory name hints
    for parent in path.parents:
        parent_name = parent.name.lower()
        for key, role in ROLE_MAP.items():
            if key in parent_name:
                return role
    return "reference"


def read_snippet(path: Path, max_chars: int = 600) -> str:
    if path.suffix.lower() not in TEXTUAL_SUFFIXES:
        return "(non-text artifact: review directly)"
    try:
        text = path.read_text(encoding="utf-8", errors="ignore")
    except Exception as exc:  # pragma: no cover - defensive; should rarely trigger
        return f"(unable to load snippet: {exc})"
    text = text.strip()
    if len(text) <= max_chars:
        return text
    return text[:max_chars].rstrip() + "\n…"


def summarize_title(path: Path) -> str:
    if path.suffix.lower() not in TEXTUAL_SUFFIXES:
        return path.name
    try:
        with path.open("r", encoding="utf-8", errors="ignore") as handle:
            first_line = handle.readline().strip()
    except Exception:  # pragma: no cover - defensive
        return path.name
    if first_line.startswith("#"):
        first_line = first_line.lstrip("# ")
    return first_line or path.name


def add_context_item(items: List[Dict[str, Any]], path: Path, repo_root: Path, explicit_role: Optional[str] = None) -> None:
    if not path.exists():
        return
    role = explicit_role or infer_role(path)
    role_count = sum(1 for item in items if item["role"] == role) + 1
    item_id = f"{role.replace('-', '_')}_{role_count:02d}"
    items.append(
        {
            "id": item_id,
            "role": role,
            "path": str(path.relative_to(repo_root)),
            "modified": iso_timestamp(path.stat().st_mtime),
            "summary": summarize_title(path),
            "snippet": read_snippet(path),
        }
    )


def gather_context_bundle(phase_path: Path, subprocess_path: Path, repo_root: Path) -> List[Dict[str, Any]]:
    items: List[Dict[str, Any]] = []

    # Shared process documents
    process_root = repo_root / "analysis" / "timesheet_process"
    shared_root = process_root / "shared"
    shared_docs = [
        process_root / "PROCESS-FLOW-COMPLETE.md",
        process_root / "STRUCTURE-STATUS-SUMMARY.md",
        process_root / "README.md",
        process_root / "CONTEXT-RESET-SUMMARY.md",
        shared_root / "context-index.json",
    ]
    for doc in shared_docs:
        add_context_item(items, doc, repo_root)

    # Phase & subprocess specific docs
    add_context_item(items, phase_path / "overview.md", repo_root)
    add_context_item(items, subprocess_path / "overview.md", repo_root)
    add_context_item(items, subprocess_path / "agent-status.json", repo_root, explicit_role="logs")

    # Key subdirectories within subprocess
    for rel_dir in ["backend", "frontend", "properties", "workflows", "issues", "assets", "cross-references"]:
        candidate = subprocess_path / rel_dir
        if not candidate.exists():
            continue
        # include summary file if present (prefer Markdown or JSON)
        for suffix in (".md", ".json", ".txt"):
            for path in sorted(candidate.glob(f"*{suffix}")):
                add_context_item(items, path, repo_root)

    return items


def checklist_to_block(lines: List[str]) -> str:
    if not lines:
        return "  - (none provided)"
    return "".join(f"  - {line}\n" for line in lines)


def context_to_block(context_items: List[Dict[str, Any]]) -> str:
    blocks: List[str] = []
    for item in context_items:
        blocks.append(
            textwrap.dedent(
                f"""- **{item['id']}** ({item['role']}) → `{item['path']}`
                  - Summary: {item['summary']}
                  - Snippet:
                    ```
                    {item['snippet']}
                    ```
                """
            ).rstrip()
        )
    return "\n".join(blocks)


def build_prompt_pack(
    template_key: str,
    phase: str,
    subprocess: str,
    context_index: Dict[str, Any],
    context_items: List[Dict[str, Any]],
    repo_root: Path,
    phase_path: Path,
    subprocess_path: Path,
) -> Dict[str, Any]:
    if template_key not in DELIVERABLE_TEMPLATES:
        raise ValueError(f"Unknown deliverable template: {template_key}")

    template = DELIVERABLE_TEMPLATES[template_key]
    target_path = subprocess_path / template["filename"]

    phase_label = phase.split("_", 1)[-1].replace("_", " ").title()
    subprocess_label = subprocess.replace("_", " ").title()

    checklist_block = checklist_to_block(template.get("checklist", []))
    acceptance_block = checklist_to_block(template.get("acceptance_tests", []))
    context_block = context_to_block(context_items)

    prompt_user = template["user_prompt_template"].format(
        deliverable=template["filename"],
        phase_label=phase_label,
        subprocess_label=subprocess_label,
        target_path=str(target_path.relative_to(repo_root)),
        summary=template["summary"],
        style=template["style"],
        checklist_block=checklist_block,
        acceptance_block=acceptance_block,
        context_block=context_block,
    )

    return {
        "metadata": {
            "phase": phase,
            "subprocess": subprocess,
            "deliverable": template_key,
            "deliverable_path": str(target_path.relative_to(repo_root)),
            "summary": template["summary"],
        },
        "inputs": {
            "context_index_path": context_index.get("_source_path", "analysis/timesheet_process/shared/context-index.json"),
            "context_items": context_items,
        },
        "constraints": {
            "style": template["style"],
            "voice": template.get("voice"),
            "checklist": template.get("checklist", []),
            "acceptance_tests": template.get("acceptance_tests", []),
        },
        "prompt": {
            "system": template["system_prompt"],
            "user": prompt_user.strip(),
        },
        "outputs": {
            "format": "markdown",
            "path": str(target_path.relative_to(repo_root)),
            "append": False,
        },
        "trace": {
            "generated_at": datetime.now().astimezone().isoformat(),
            "builder": "analysis/timesheet_process/shared/prompt_pack_builder.py",
            "model_hint": template.get("model_hint", ""),
            "notes": f"Context index timestamp: {context_index.get('generated_at', 'unknown')}"
        }
    }


def load_context_index(path: Path) -> Dict[str, Any]:
    if not path.exists():
        raise FileNotFoundError(f"Context index not found at {path}. Run context_index.py first.")
    data = json.loads(path.read_text(encoding="utf-8"))
    data["_source_path"] = str(path.relative_to(Path.cwd())) if path.is_absolute() else str(path)
    return data


def determine_paths(phase: str, subprocess: str, repo_root: Path) -> Dict[str, Path]:
    timesheet_root = repo_root / "analysis" / "timesheet_process"
    phase_path = timesheet_root / phase
    if not phase_path.exists():
        raise FileNotFoundError(f"Phase directory not found: {phase_path}")
    subprocess_path = phase_path / subprocess
    if not subprocess_path.exists():
        raise FileNotFoundError(f"Subprocess directory not found: {subprocess_path}")
    return {
        "timesheet_root": timesheet_root,
        "phase_path": phase_path,
        "subprocess_path": subprocess_path,
    }


def resolve_repo_root() -> Path:
    return Path(__file__).resolve().parents[3]


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Generate AI prompt packs using the shared context index.")
    parser.add_argument("phase", help="Phase identifier (e.g., 01_foundation)")
    parser.add_argument("subprocess", help="Subprocess slug (e.g., project_configuration)")
    parser.add_argument("deliverable", choices=sorted(DELIVERABLE_TEMPLATES.keys()), help="Deliverable template key")
    parser.add_argument(
        "--context-index",
        dest="context_index_path",
        default=Path(__file__).resolve().parent / "context-index.json",
        type=Path,
        help="Path to context-index.json (default: sibling file)",
    )
    parser.add_argument(
        "--output",
        dest="output_path",
        type=Path,
        default=None,
        help="Optional output path for the prompt pack (defaults to subprocess directory)",
    )
    parser.add_argument(
        "--pretty",
        action="store_true",
        help="Pretty-print JSON output",
    )
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    repo_root = resolve_repo_root()
    paths = determine_paths(args.phase, args.subprocess, repo_root)

    context_index = load_context_index(args.context_index_path)
    context_items = gather_context_bundle(paths["phase_path"], paths["subprocess_path"], repo_root)

    prompt_pack = build_prompt_pack(
        template_key=args.deliverable,
        phase=args.phase,
        subprocess=args.subprocess,
        context_index=context_index,
        context_items=context_items,
        repo_root=repo_root,
        phase_path=paths["phase_path"],
        subprocess_path=paths["subprocess_path"],
    )

    default_output = paths["subprocess_path"] / f"prompt-pack.{args.deliverable}.json"
    output_path = args.output_path or default_output

    output_path.write_text(
        json.dumps(prompt_pack, indent=2 if args.pretty else None, ensure_ascii=False),
        encoding="utf-8",
    )
    print(f"Prompt pack written to {output_path.relative_to(repo_root)}")


if __name__ == "__main__":
    main()








