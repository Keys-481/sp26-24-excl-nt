#!/usr/bin/env bash
set -eou pipefail

# Config
MODE="${1:-all}"
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$ROOT_DIR/backend"
FRONTEND_DIR="$ROOT_DIR/frontend"

# Load .env.test
if [[ -f "$ROOT_DIR/.env.test" ]]; then
    # shellcheck disable=SC2046
    export $(grep -vE '^\s*#' "$ROOT_DIR/.env.test" | xargs -I{} echo {})
fi

# Helper functions

script_exists() {
    local pkg="$1" name="$2"
    # Use node
    node -e "const p=require('$pkg');process.exit(p.scripts && p.scripts['$name'] ? 0 : 1)" 2>/dev/null
}

npm_install_if_needed() {
    local dir="$1"
    if [[ -f "$dir/package-lock.json" ]]; then
        (cd "$dir" && npm ci)
    else
        (cd "$dir" && npm i)
    fi
}

#---Backend Tests---
if [[ "$MODE" != "frontend-only" ]]; then
    if [[ -f "$BACKEND_DIR/package.json" ]]; then
        echo "Installing backend deps and running tests..."
        npm_install_if_needed "$BACKEND_DIR"

        if script_exists "$BACKEND_DIR/package.json" "test"; then
            (cd "$BACKEND_DIR" && npm test --silent --if-present)
        else
            (cd "$BACKEND_DIR" && npx jest --coverage)
        fi
    else
        echo "Backend tests skipped via frontend-only."
    fi
fi

#---Frontend Tests---
if [[ "$MODE" != "backend-only" ]]; then
    if [[ -f "$FRONTEND_DIR/package.json" ]]; then
        echo "Installing frontend deps and running tests..."
        npm_install_if_needed "$FRONTEND_DIR"

        echo "Installing backend deps for e2e tests..."
        npm_install_if_needed "$BACKEND_DIR"

        # Build SPA
        echo "Building frontend for e2e tests..."
        (cd "$FRONTEND_DIR" && npm run build)

        # Tell server.js where to find the built frontend
        export FRONTEND_DIST="$FRONTEND_DIR/dist"

        # Avoid reinstalling browsers if cached
        if [[ ! -d "$HOME/.cache/ms-playwright" ]]; then
            (cd "$FRONTEND_DIR" && npx playwright install)
        fi

        echo "Running frontend playwright tests..."
        (cd "$FRONTEND_DIR" && npx playwright test)
    else
        echo "Frontend tests skipped via backend-only."
    fi
fi

echo "Test script completed."