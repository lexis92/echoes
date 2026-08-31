#!/usr/bin/env bash
# Applies every migration and the seed to a throwaway database, then runs the
# RLS assertions in rls_test.sql. Requires a reachable PostgreSQL 15+.
#
#   PGURL="postgres://user@localhost:5432/postgres" supabase/tests/run.sh
set -euo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$(dirname "$(dirname "$HERE")")"
: "${PGURL:?Set PGURL to a PostgreSQL connection string}"

psql "$PGURL" -v ON_ERROR_STOP=1 -q -f "$HERE/_supabase_shim.sql"

for migration in "$ROOT"/supabase/migrations/*.sql; do
  echo "→ $(basename "$migration")"
  psql "$PGURL" -v ON_ERROR_STOP=1 -q -f "$migration"
done

echo "→ seed.sql"
psql "$PGURL" -v ON_ERROR_STOP=1 -q -f "$ROOT/supabase/seed.sql"

echo "→ rls_test.sql"
psql "$PGURL" -v ON_ERROR_STOP=1 -q -f "$HERE/rls_test.sql"

echo "All database checks passed."
