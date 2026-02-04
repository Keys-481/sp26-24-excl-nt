#!/usr/bin/env bash
set -euo pipefail

print_section() {
    echo ""
    echo "=== $1 ==="
}

print_command() {
    printf " %-24s %s\n" "$1" "$2"
}

print_usage() {
    print_section "ROOT COMMAND USAGE"
    print_command "npm run dev" "Run backend + frontend concurrently for development with hot-reloading"
    print_command "npm run build" "Build and start all services for production using Docker Compose"
    print_command "npm run clean" "Stop and remove Docker/Podman containers"
    print_command "npm run test" "Run all tests for backend and frontend"
    print_command "npm run help" "Display this help message"

    print_section "BACKEND COMMAND USAGE"
    print_command "npm run dev:backend" "Run backend in dev mode"
    print_command "(cd backend && npm test)" "Run backend tests"
    print_command "(cd backend && npm run db:setup)" "Setup the backend database"

    print_section "FRONTEND COMMAND USAGE"
    print_command "npm run dev:frontend" "Run frontend in dev mode"
    print_command "(cd frontend && npm test)" "Run frontend tests"
    print_command "(cd frontend && npm run build)" "Build the frontend for production"

    echo ""
    echo "For more details see:"
    print_command "./package.json" "Root scripts"
    print_command "backend/package.json" "Backend scripts"
    print_command "frontend/package.json" "Frontend scripts"
    echo ""
}

print_usage