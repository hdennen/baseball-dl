#!/usr/bin/env bash
set -euo pipefail

if [ $# -ne 1 ]; then
  echo "Usage: $0 <connection-string>"
  echo "Example: $0 \"postgresql://user:pass@ep-xyz.neon.tech/baseball_dl?sslmode=require\""
  exit 1
fi

CONNECTION_STRING="$1"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
INIT_DIR="$SCRIPT_DIR/../db/init"

for f in "$INIT_DIR"/*.sql; do
  echo "Running $(basename "$f")..."
  psql "$CONNECTION_STRING" -f "$f"
done

echo "Done."
