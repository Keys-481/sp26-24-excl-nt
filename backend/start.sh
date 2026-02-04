#!/bin/sh
set -e

DB_WAIT_TIMEOUT=60
SLEEP_INTERVAL=1
elapsed=0

# Wait for Postgres server
echo "Waiting for Postgres server $DB_HOST:$DB_PORT..."
until pg_isready -h "$DB_HOST" -p "$DB_PORT" -U postgres > /dev/null 2>&1; do
    sleep $SLEEP_INTERVAL
    elapsed=$((elapsed + SLEEP_INTERVAL))
    if [ "$elapsed" -ge "$DB_WAIT_TIMEOUT" ]; then
        echo "Error: Postgres did not become ready within $DB_WAIT_TIMEOUT seconds"
        exit 1
    fi
done
echo "Postgres server is up!"

# Run DB setup (creates user, DB, applies schema)
echo "Running database setup..."
node /app/backend/db_setup.js
echo "Database setup complete!"

# Start backend server
echo "Starting backend..."
exec node /app/backend/server.js
