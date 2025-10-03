#!/usr/bin/env python3
"""Quick validation for WF-04/WF-05 workflow exports.

Checks that the exported workflow files contain the expected association type IDs.
"""
from __future__ import annotations
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[5]  # repo root
WORKFLOW_DIR = ROOT / "data" / "raw" / "workflows"

WORKFLOWS = {
    "v4-flow-567358311.json": {126, 128},
    "v4-flow-567358566.json": {128},
}

def validate() -> int:
    missing_files = []
    failures = []

    for filename, expected_ids in WORKFLOWS.items():
        path = WORKFLOW_DIR / filename
        if not path.exists():
            missing_files.append(filename)
            continue
        text = path.read_text(encoding="utf-8", errors="ignore")
        missing_ids = [aid for aid in expected_ids if f"{aid}" not in text]
        if missing_ids:
            failures.append((filename, missing_ids))

    if missing_files:
        print("Missing workflow exports:")
        for filename in missing_files:
            print(f"  - {filename}")
    if failures:
        print("Failed association checks:")
        for filename, ids in failures:
            joined = ", ".join(str(i) for i in ids)
            print(f"  - {filename}: missing association IDs {joined}")

    if missing_files or failures:
        return 1

    print("WF-04/WF-05 exports contain expected association IDs (126/128).")
    return 0

if __name__ == "__main__":
    sys.exit(validate())
