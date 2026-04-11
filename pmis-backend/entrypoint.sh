#!/bin/sh
set -e

DB_FILE="/app/pmis.db"

# Seed the DB only on first run (when DB doesn't exist yet)
if [ ! -f "$DB_FILE" ]; then
    echo "=== DB not found. Running seed script ==="
    python seed/generate_seed.py
    echo "=== Seeding complete ==="
else
    echo "=== DB already exists at $DB_FILE — skipping seed ==="
fi

# Start the application
exec gunicorn --bind 0.0.0.0:5000 --workers 2 --timeout 120 run:app
