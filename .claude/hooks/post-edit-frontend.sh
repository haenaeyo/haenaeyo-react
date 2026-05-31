#!/usr/bin/env bash
# Claude Code PostToolUse hook: run fast frontend checks after relevant edits.

set -euo pipefail

INPUT=$(cat)
FILE=$(printf '%s' "$INPUT" | python3 -c '
import json
import sys

try:
    payload = json.load(sys.stdin)
except Exception:
    print("")
    raise SystemExit(0)

tool_input = payload.get("tool_input", {})
print(tool_input.get("file_path") or tool_input.get("path") or "")
' 2>/dev/null || true)

[[ -n "$FILE" ]] || exit 0

REPO_ROOT=$(git rev-parse --show-toplevel 2>/dev/null || pwd)

case "$FILE" in
  "$REPO_ROOT"/*) ABS_FILE="$FILE" ;;
  /*) ABS_FILE="$FILE" ;;
  *) ABS_FILE="$PWD/$FILE" ;;
esac

case "$ABS_FILE" in
  "$REPO_ROOT"/src/*.ts|"$REPO_ROOT"/src/*.tsx|"$REPO_ROOT"/src/*/*.ts|"$REPO_ROOT"/src/*/*.tsx|"$REPO_ROOT"/src/*/*/*.ts|"$REPO_ROOT"/src/*/*/*.tsx|"$REPO_ROOT"/src/*/*/*/*.ts|"$REPO_ROOT"/src/*/*/*/*.tsx|"$REPO_ROOT"/package.json|"$REPO_ROOT"/package-lock.json|"$REPO_ROOT"/pnpm-lock.yaml|"$REPO_ROOT"/yarn.lock|"$REPO_ROOT"/vite.config.*|"$REPO_ROOT"/tsconfig*.json|"$REPO_ROOT"/tailwind.config.*|"$REPO_ROOT"/postcss.config.*|"$REPO_ROOT"/eslint.config.*|"$REPO_ROOT"/src/*.css|"$REPO_ROOT"/src/*/*.css|"$REPO_ROOT"/src/*/*/*.css)
    ;;
  *)
    exit 0
    ;;
esac

cd "$REPO_ROOT"

if [[ ! -f package.json ]]; then
  echo "package.json 없음: React 프로젝트 scaffold 전이라 프론트엔드 훅 검증을 건너뜀"
  exit 0
fi

has_script() {
  local script_name="$1"
  node -e "const p=require('./package.json'); process.exit(p.scripts && p.scripts['$script_name'] ? 0 : 1)" >/dev/null 2>&1
}

run_script_if_present() {
  local script_name="$1"

  if has_script "$script_name"; then
    echo "프론트엔드 변경 감지: npm run $script_name"
    npm run "$script_name"
  fi
}

run_script_if_present "format:check"
run_script_if_present "lint"
run_script_if_present "typecheck"
run_script_if_present "test"
