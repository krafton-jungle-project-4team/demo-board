#!/usr/bin/env python3
"""Score this template project with static structure checks.

This helper does not replace npm run verify or runtime smoke checks.
"""

from __future__ import annotations

import argparse
import json
from pathlib import Path
from typing import Callable


Check = tuple[str, int, Callable[[Path], bool]]


def file_exists(relative_path: str) -> Callable[[Path], bool]:
    return lambda root: (root / relative_path).is_file()


def dir_exists(relative_path: str) -> Callable[[Path], bool]:
    return lambda root: (root / relative_path).is_dir()


def text_contains(relative_path: str, needle: str) -> Callable[[Path], bool]:
    def check(root: Path) -> bool:
        path = root / relative_path
        return path.is_file() and needle in path.read_text(encoding="utf-8", errors="ignore")

    return check


def any_text_contains(glob: str, needle: str) -> Callable[[Path], bool]:
    def check(root: Path) -> bool:
        for path in root.glob(glob):
            if path.is_file() and needle in path.read_text(encoding="utf-8", errors="ignore"):
                return True
        return False

    return check


def no_path_matches(glob: str) -> Callable[[Path], bool]:
    return lambda root: not any(root.glob(glob))


def no_text_contains(glob: str, needle: str) -> Callable[[Path], bool]:
    def check(root: Path) -> bool:
        for path in root.glob(glob):
            if path.is_file() and needle in path.read_text(encoding="utf-8", errors="ignore"):
                return False
        return True

    return check


def file_text_contains(relative_path: str, needle: str) -> Callable[[Path], bool]:
    return text_contains(relative_path, needle)


def file_text_not_contains(relative_path: str, needle: str) -> Callable[[Path], bool]:
    def check(root: Path) -> bool:
        path = root / relative_path
        return path.is_file() and needle not in path.read_text(encoding="utf-8", errors="ignore")

    return check


def any_file_exists(relative_paths: list[str]) -> Callable[[Path], bool]:
    return lambda root: any((root / relative_path).is_file() for relative_path in relative_paths)


def feature_prompt_is_simple(relative_path: str) -> Callable[[Path], bool]:
    forbidden_terms = [
        "typeorm",
        "injectrepository",
        "datasource",
        "sql",
        "zod",
        "toss-frontend-fundamentals",
        "vercel-react-best-practices",
        "vercel-composition-patterns",
        "writing-guidelines",
        "react doctor",
        "agents.md",
        "스킬",
    ]

    def check(root: Path) -> bool:
        path = root / relative_path
        if not path.is_file():
            return False
        text = path.read_text(encoding="utf-8", errors="ignore").strip()
        lowered = text.lower()
        return 0 < len(text) <= 500 and all(term not in lowered for term in forbidden_terms)

    return check


def package_has_script(package_path: str, script_name: str) -> Callable[[Path], bool]:
    def check(root: Path) -> bool:
        package_json = read_package(root / package_path)
        return script_name in package_json.get("scripts", {})

    return check


def package_has_dependency(package_path: str, dependency_name: str) -> Callable[[Path], bool]:
    def check(root: Path) -> bool:
        package_json = read_package(root / package_path)
        dependencies = package_json.get("dependencies", {})
        dev_dependencies = package_json.get("devDependencies", {})
        peer_dependencies = package_json.get("peerDependencies", {})
        return dependency_name in dependencies or dependency_name in dev_dependencies or dependency_name in peer_dependencies

    return check


def read_package(path: Path) -> dict:
    if not path.is_file():
        return {}

    try:
        value = json.loads(path.read_text(encoding="utf-8"))
    except json.JSONDecodeError:
        return {}

    return value if isinstance(value, dict) else {}


BASE_CHECKS: list[Check] = [
    ("workspace apps/web-client", 2, dir_exists("apps/web-client")),
    ("workspace apps/api-server", 2, dir_exists("apps/api-server")),
    ("workspace packages/shared", 2, dir_exists("packages/shared")),
    ("workspace packages/ui", 2, dir_exists("packages/ui")),
    ("docs/ai exists", 1, dir_exists("docs/ai")),
    (".codex/skills exists", 1, dir_exists(".codex/skills")),
    ("root AGENTS", 2, file_exists("AGENTS.md")),
    ("web AGENTS", 2, file_exists("apps/web-client/AGENTS.md")),
    ("api AGENTS", 2, file_exists("apps/api-server/AGENTS.md")),
    ("shared AGENTS", 2, file_exists("packages/shared/AGENTS.md")),
    ("ui AGENTS", 2, file_exists("packages/ui/AGENTS.md")),
    ("root verify script", 3, package_has_script("package.json", "verify")),
    ("root dev:api script", 2, package_has_script("package.json", "dev:api")),
    ("root dev:db script", 2, package_has_script("package.json", "dev:db")),
    ("root preview:web script", 1, package_has_script("package.json", "preview:web")),
    ("eslint config", 2, file_exists("eslint.config.mjs")),
    ("prettier config", 1, any_file_exists(["prettier.config.mjs", ".prettierrc", ".prettierrc.json"])),
    ("compose file", 2, file_exists("compose.yml")),
    ("api env example", 1, file_exists("apps/api-server/.env.example")),
    ("web env example", 1, file_exists("apps/web-client/.env.example")),
    ("api core dir", 1, dir_exists("apps/api-server/src/core")),
    ("api infra env", 1, dir_exists("apps/api-server/src/infra/env")),
    ("api infra http", 2, dir_exists("apps/api-server/src/infra/http")),
    ("api infra database", 1, dir_exists("apps/api-server/src/infra/database")),
    ("api example feature", 3, dir_exists("apps/api-server/src/features/example")),
    ("api example controller", 2, file_exists("apps/api-server/src/features/example/controller/example.controller.ts")),
    ("api example service", 2, file_exists("apps/api-server/src/features/example/service/example-query.service.ts")),
    ("api example entity", 3, file_exists("apps/api-server/src/features/example/database/example-item.entity.ts")),
    (
        "api example repository backed",
        4,
        any_text_contains("apps/api-server/src/features/example/service/**/*.ts", "InjectRepository"),
    ),
    ("health feature", 1, dir_exists("apps/api-server/src/features/health")),
    ("api response requestId", 3, any_text_contains("apps/api-server/src/infra/http/**/*.ts", "requestId")),
    ("domain error", 2, any_text_contains("apps/api-server/src/**/*.ts", "DomainError")),
    ("shared api contract", 3, file_exists("packages/shared/src/contracts/api.contract.ts")),
    ("shared example contract", 3, file_exists("packages/shared/src/contracts/example.contract.ts")),
    ("shared zod dependency", 2, package_has_dependency("packages/shared/package.json", "zod")),
    ("shared tsup dependency", 1, package_has_dependency("packages/shared/package.json", "tsup")),
    ("ui components export", 2, file_exists("packages/ui/src/components.ts")),
    ("ui globals css", 1, file_exists("packages/ui/src/styles/globals.css")),
    ("ui button primitive", 1, file_exists("packages/ui/src/components/button.tsx")),
    ("ui field primitive", 1, file_exists("packages/ui/src/components/field.tsx")),
    ("ui table primitive", 1, file_exists("packages/ui/src/components/table.tsx")),
    ("ui radix dependency", 1, package_has_dependency("packages/ui/package.json", "radix-ui")),
    ("web router", 2, file_exists("apps/web-client/src/app/router.tsx")),
    ("web app providers", 1, dir_exists("apps/web-client/src/app/providers")),
    ("web root ui", 1, dir_exists("apps/web-client/src/app/root")),
    ("web routes", 2, dir_exists("apps/web-client/src/routes")),
    ("web pages", 2, dir_exists("apps/web-client/src/pages")),
    ("web example feature api", 2, dir_exists("apps/web-client/src/features/example/api")),
    ("web example feature model", 1, dir_exists("apps/web-client/src/features/example/model")),
    ("web example feature hooks", 1, dir_exists("apps/web-client/src/features/example/hooks")),
    ("web example feature ui", 1, dir_exists("apps/web-client/src/features/example/ui")),
    ("web example feature lib", 1, dir_exists("apps/web-client/src/features/example/lib")),
    ("web typed http client", 3, file_exists("apps/web-client/src/shared/api/http-client.ts")),
    ("web client env", 1, file_exists("apps/web-client/src/shared/env/client-env.ts")),
    ("tanstack router dependency", 2, package_has_dependency("apps/web-client/package.json", "@tanstack/react-router")),
    ("tanstack query dependency", 2, package_has_dependency("apps/web-client/package.json", "@tanstack/react-query")),
    ("ky dependency", 1, package_has_dependency("apps/web-client/package.json", "ky")),
    ("react hook form dependency", 1, package_has_dependency("apps/web-client/package.json", "react-hook-form")),
    ("api nest dependency", 2, package_has_dependency("apps/api-server/package.json", "@nestjs/core")),
    ("api typeorm dependency", 2, package_has_dependency("apps/api-server/package.json", "typeorm")),
    ("api postgres dependency", 1, package_has_dependency("apps/api-server/package.json", "pg")),
    ("api pino dependency", 1, package_has_dependency("apps/api-server/package.json", "nestjs-pino")),
]


HARNESS_CHECKS: list[Check] = [
    ("example model README", 1, file_exists("apps/web-client/src/features/example/model/README.md")),
    ("example hooks README", 1, file_exists("apps/web-client/src/features/example/hooks/README.md")),
    ("example ui README", 1, file_exists("apps/web-client/src/features/example/ui/README.md")),
    ("example lib README", 1, file_exists("apps/web-client/src/features/example/lib/README.md")),
]


GENERATION_HARNESS_CHECKS: list[Check] = []


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("project_root", type=Path)
    parser.add_argument(
        "--generation-harness",
        action="store_true",
        help="include generation-stage AGENTS and no-feature checks",
    )
    parser.add_argument("--harness", action="store_true", help="include prompt harness, AGENTS, skill, and feature-task checks")
    args = parser.parse_args()

    root = args.project_root.resolve()
    if not root.is_dir():
        raise SystemExit(f"Project root is not a directory: {root}")

    total = 0
    earned = 0
    rows = []

    checks = BASE_CHECKS
    if args.generation_harness:
        checks += GENERATION_HARNESS_CHECKS
    if args.harness:
        checks += HARNESS_CHECKS

    for name, points, check in checks:
        total += points
        passed = check(root)
        if passed:
            earned += points
        rows.append((name, points, passed))

    print(f"# Static starter score: {earned}/{total}")
    print()
    print("| Check | Points | Result |")
    print("| --- | ---: | --- |")
    for name, points, passed in rows:
        result = "pass" if passed else "fail"
        print(f"| {name} | {points} | {result} |")

    print()
    print("Runtime evidence still required:")
    print("- npm run verify")
    print("- optional API/Web smoke checks")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
