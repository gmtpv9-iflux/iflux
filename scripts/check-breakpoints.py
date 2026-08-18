#!/usr/bin/env python3
"""
Breakpoint CI audit v1 — regex literals only.

LIMITATIONS (see docs/.../11-CI-Breakpoint-Audit.md §2):
  Does NOT catch: const TABLET = 900; innerWidth <= TABLET
  Roadmap v2: AST trace for indirect breakpoints.

FAIL on responsive literals outside Foundation + Exception Registry.
"""
from __future__ import annotations

import argparse
import json
import os
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DEFAULT_EXCEPTIONS = (
    ROOT
    / "docs/Product Backlog/270727_Responsive Breakpoint Consolidation/breakpoint-exceptions.json"
)
SCAN_ROOTS = ["User_Web", "Admin_Design_system"]
SKIP_DIRS = {".git", "node_modules", "vendor", "_bak", ".cursor", "files (3)"}
DEFAULT_FOUNDATION = {375, 640, 768, 1024, 1280, 1440, 1600}

PATTERNS = [
    (re.compile(r"@media\s*\([^)]*(?:max-width|min-width):\s*([\d.]+)px"), "css-media"),
    (re.compile(r"@container\s*\([^)]*(?:max-width|min-width):\s*([\d.]+)px"), "css-container"),
    (re.compile(r"innerWidth\s*<=?\s*([\d.]+)"), "js-innerWidth"),
    (re.compile(r"innerWidth\s*>=?\s*([\d.]+)"), "js-innerWidth"),
    (re.compile(r"(?:DRAWER_MAX|MOBILE_\w+_MAX)\s*=\s*([\d.]+)"), "js-const"),
    (re.compile(r"matchMedia\s*\(\s*['\"]([^'\"]+)['\"]\s*\)"), "js-matchMedia"),
]


def load_exceptions(path: Path) -> tuple[set[float], list[dict]]:
    if not path.is_file():
        return set(DEFAULT_FOUNDATION), []
    data = json.loads(path.read_text(encoding="utf-8"))
    foundation = set(float(x) for x in data.get("foundationPx", DEFAULT_FOUNDATION))
    return foundation, data.get("exceptions", [])


def allowed_px(value: str, filepath: str, foundation: set[float], exceptions: list[dict]) -> bool:
    try:
        px = float(value)
    except ValueError:
        return True
    if px in foundation:
        return True
    norm = filepath.replace("\\", "/")
    for exc in exceptions:
        if float(exc.get("px", -1)) != px:
            continue
        scope = exc.get("files", [])
        if any(s in norm or norm.endswith(s.lstrip("/")) for s in scope):
            return True
    return False


def scan_file(path: Path, foundation: set[float], exceptions: list[dict]) -> list[str]:
    rel = str(path.relative_to(ROOT)).replace("\\", "/")
    if "primitives/layout.css" in rel and path.name == "layout.css":
        return []
    violations: list[str] = []
    try:
        text = path.read_text(encoding="utf-8", errors="ignore")
    except OSError:
        return violations
    for i, line in enumerate(text.splitlines(), 1):
        for rx, kind in PATTERNS:
            for m in rx.finditer(line):
                if kind == "js-matchMedia":
                    for n in re.findall(r"([\d.]+)px", m.group(1)):
                        if not allowed_px(n, rel, foundation, exceptions):
                            violations.append(f"{rel}:{i} [{kind}] px={n} :: {line.strip()[:100]}")
                else:
                    bp = m.group(1)
                    if not allowed_px(bp, rel, foundation, exceptions):
                        violations.append(f"{rel}:{i} [{kind}] px={bp} :: {line.strip()[:100]}")
    return violations


def main() -> int:
    parser = argparse.ArgumentParser(description="Breakpoint SoT CI audit")
    parser.add_argument("--exceptions", type=Path, default=DEFAULT_EXCEPTIONS)
    args = parser.parse_args()
    foundation, exceptions = load_exceptions(args.exceptions)
    all_v: list[str] = []
    for root_name in SCAN_ROOTS:
        root = ROOT / root_name
        if not root.is_dir():
            continue
        for dirpath, dirnames, filenames in os.walk(root):
            dirnames[:] = [d for d in dirnames if d not in SKIP_DIRS]
            for fn in filenames:
                if fn.endswith((".css", ".js")):
                    all_v.extend(scan_file(Path(dirpath) / fn, foundation, exceptions))
    if all_v:
        print(f"FAIL — {len(all_v)} breakpoint violation(s) outside Foundation + Exception Registry:\n")
        for v in sorted(all_v):
            print(v)
        print("\nFoundation px:", sorted(foundation))
        print("Exceptions loaded:", len(exceptions))
        return 1
    print("PASS — no breakpoint violations detected.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
