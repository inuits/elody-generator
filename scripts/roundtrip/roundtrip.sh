#!/usr/bin/env bash
# Value preservation (SHACL 1.2 UI feature 30) through the whole Elody stack:
# every hop runs the platform's own code against a local stack.
#   1. prepare  (host)            shapes.ttl → declaration → GraphQL documents
#   2. create   (collection-api)  store entity.json, read it back      → stored.json
#   3. read     (GraphQL)         baseGraphql resolves the detail page → read.json
#   4. form     (PWA)             detail page edit: one edit, save input → payload.json
#   5. write    (GraphQL)         mutateEntityValues → PATCH body       → patch.json
#   6. apply    (collection-api)  PATCH, read back, delete the entity   → after.json
#   7. compare  (host)            after = stored + edits, nothing else changed
#
# usage: scripts/roundtrip/roundtrip.sh <PWA checkout with node_modules> [graphql container] [collection-api container]
set -euo pipefail
here="$(cd "$(dirname "$0")" && pwd)"
pwa="$1"
graphql="${2:-inuits-elody-dishacled-wp3-prototype-elody-dashboard-1}"
api="${3:-inuits-elody-dishacled-wp3-prototype-elody-collection-api-1}"
# baseGraphql as the container sees it (the dashboard mounts elody-common/modules)
basegraphql="${BASEGRAPHQL:-/app/inuits-dams-graphql-service/modules/baseGraphql}"
out="$here/out"

rm -rf "$out" && mkdir -p "$out"
npx tsx "$here/prepare.ts" "$out"

# files go in and out of the collection-api container through pipes (it runs as a non-root user)
work=/tmp/elody-roundtrip
put() { docker exec -i "$api" sh -c "cat > $work/$2" < "$1"; }
get() { docker exec "$api" cat "$work/$1" > "$out/$1"; }
docker exec "$api" sh -c "rm -rf $work && mkdir -p $work"
put "$here/store.py" store.py
put "$here/entity.json" entity.json
put "$here/relations.json" relations.json
docker exec "$api" python3 "$work/store.py" create "$work"
get stored.json
get stored-related.json
cp "$here/relations.json" "$out/relations.json"
get ids.json

# the GraphQL steps run in the container: the script and the out directory go in, the results come back
gwork=/tmp/elody-generator-roundtrip
graphql_step() {
  docker exec "$graphql" sh -c "rm -rf $gwork && mkdir -p $gwork"
  docker cp "$here/graphql.cts" "$graphql:$gwork/graphql.cts"
  docker cp "$out" "$graphql:$gwork/out"
  docker exec -w "$gwork" "$graphql" \
    /app/inuits-dams-graphql-service/node_modules/.bin/tsx graphql.cts "$1" "$gwork/out" "$basegraphql"
  docker cp "$graphql:$gwork/out/." "$out/"
}
graphql_step read

mkdir -p "$pwa/src/roundtrip"
cp "$here/form.test.ts" "$pwa/src/roundtrip/form.test.ts"
(cd "$pwa" && ROUNDTRIP_DIR="$out" node_modules/.bin/vitest run src/roundtrip/form.test.ts --reporter=dot >/dev/null) \
  || { echo "form step failed"; (cd "$pwa" && ROUNDTRIP_DIR="$out" node_modules/.bin/vitest run src/roundtrip/form.test.ts | tail -30); exit 1; }
echo "form: $(node -e "console.log(require('$out/payload.json').formInput.metadata.length)") metadata items in the save input"

graphql_step write

put "$out/patch.json" patch.json
docker exec "$api" python3 "$work/store.py" apply "$work"
get after.json

npx tsx "$here/compare.ts" "$out"
