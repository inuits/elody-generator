"""Value-preservation round trip, steps 1 and 5 (in the collection-api container).

  create  — POST entity.json, then GET it back as baseGraphql would: stored.json
  apply   — PATCH the metadata baseGraphql sends (patch.json), GET: after.json,
            then delete the test entity

usage: python3 store.py <create|apply> <dir>
"""
import json
import sys
import urllib.request

API = "http://localhost:5000"
phase, folder = sys.argv[1], sys.argv[2]


def call(method, path, body=None):
    request = urllib.request.Request(
        API + path,
        method=method,
        data=json.dumps(body).encode() if body is not None else None,
        headers={"Content-Type": "application/json"},
    )
    with urllib.request.urlopen(request, timeout=30) as response:
        text = response.read().decode()
        return json.loads(text) if text.strip()[:1] in ("{", "[") else text


def save(name, data):
    with open(f"{folder}/{name}", "w") as handle:
        json.dump(data, handle, indent=2)


def load(name):
    with open(f"{folder}/{name}") as handle:
        return json.load(handle)


if phase == "create":
    created = call("POST", "/entities", load("entity.json"))
    save("stored.json", call("GET", f"/entities/{created['_id']}"))
    print(f"create: entity {created['_id']}")
elif phase == "apply":
    entity_id = load("stored.json")["_id"]
    try:
        metadata = load("patch.json").get("metadata") or []
        if metadata:
            call("PATCH", f"/entities/{entity_id}/metadata", metadata)
        save("after.json", call("GET", f"/entities/{entity_id}"))
        print(f"apply: patched {len(metadata)} items")
    finally:
        call("DELETE", f"/entities/{entity_id}")
