#!/usr/bin/env bash
set -euo pipefail

# Detect docker or podman
detect_compose() {
    local runtime=""
    local compose_cmd=""

    # Detect docker, else podman
    if command -v docker >/dev/null 2>&1; then
        runtime="docker"
    elif command -v podman >/dev/null 2>&1; then
        runtime="podman"
    fi

    # Try docker compose, then podman compose
    if [[ -n "$runtime" ]] && "${runtime}" compose version >/dev/null 2>&1; then
        compose_cmd="${runtime} compose"
    else
        if command -v docker-compose >/dev/null 2>&1; then
            compose_cmd="docker-compose"
        elif command -v podman-compose >/dev/null 2>&1; then
            compose_cmd="podman-compose"
        fi
    fi

    if [[ -z "${compose_cmd:-}" ]]; then
        echo "Neither Docker nor Podman with Compose support is installed. Please install one of them to proceed." >&2
        exit 1
    fi

    echo "$compose_cmd"
}

COMPOSE=$(detect_compose)

echo "=========================================="
echo "Stopping and removing services..."
${COMPOSE} down -v "$@"
echo "Done."
echo "=========================================="