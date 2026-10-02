#!/usr/bin/env bash
# The SHACL 1.2 UI spec examples through the whole Elody pipeline:
#   1. shapes → fromShacl → Elody declaration → generate → GraphQL      (host)
#   2. validate + execute against baseGraphql's resolvers                (Elody GraphQL container)
#   3. Storybook stories in a PWA checkout on feat/storybook             (host)
#   4. screenshots of every story with headless Chrome                   (host, Storybook running)
#
# usage: scripts/showcase.sh <pwa checkout on feat/storybook> <screenshot dir> [container]
#   the container is an Elody dashboard container that mounts elody-common/modules
#   at /app/inuits-dams-graphql-service/modules (any local client stack does);
#   Storybook must be running on STORYBOOK_URL (default http://localhost:6016) for step 4.
set -euo pipefail
here="$(cd "$(dirname "$0")/.." && pwd)"
pwa="$1"; shots="$2"; container="${3:-inuits-elody-dishacled-wp3-prototype-elody-dashboard-1}"
storybook="${STORYBOOK_URL:-http://localhost:6016}"
chrome="${CHROME:-/Applications/Google Chrome.app/Contents/MacOS/Google Chrome}"
mounted=/app/inuits-dams-graphql-service/modules

cd "$here"
npx tsx scripts/showcase.ts showcase-out
docker exec -w "$mounted/uiDeclarationModule" "$container" \
  /app/inuits-dams-graphql-service/node_modules/.bin/tsx scripts/showcase-execute.cts \
  "$mounted/uiDeclarationModule/showcase-out" "$mounted/baseGraphql"
npx tsx scripts/showcase-stories.ts showcase-out "$pwa"

mkdir -p "$shots"
node -e '
const m = require("./showcase-out/manifest.json");
for (const r of m) if (r.status === "generated") console.log(r.id);' | while read -r id; do
  story="shacl-ui-spec-examples--example-$(echo "$id" | sed -E 's/([a-z0-9])([A-Z])/\1-\2/g; s/([A-Z])([A-Z][a-z])/\1-\2/g' | tr 'A-Z' 'a-z')"
  "$chrome" --headless=new --disable-gpu --hide-scrollbars --window-size=1240,620 --virtual-time-budget=15000 \
    --screenshot="$shots/$id.png" "$storybook/iframe.html?id=$story&viewMode=story" >/dev/null 2>&1
  echo "captured $id"
done
