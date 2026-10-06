"""Value-preservation round trip, the collection-api steps (in its container).

  create  — create the related entities and the book (entity.json), add the
            initial relations (relations.json), read the book back: stored.json,
            and the ids of the related entities: ids.json
  apply   — apply what baseGraphql sends (patch.json: metadata PATCH, relations
            PUT or PATCH), read the book and the related entities back:
            after.json, then delete every test entity

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
    relations = load("relations.json")
    ids = {}
    for name in relations["related"]:
        created = call("POST", "/entities", {"type": "entity", "metadata": [{"key": "title", "value": f"Collection {name}"}]})
        ids[name] = created["_id"]
    book = call("POST", "/entities", load("entity.json"))
    ids["book"] = book["_id"]
    initial = [{"key": ids[r["to"]], "type": r["type"]} for r in relations["initial"]]
    call("POST", f"/entities/{book['_id']}/relations", initial)
    save("ids.json", ids)
    save("stored.json", call("GET", f"/entities/{book['_id']}"))
    save("stored-related.json", {name: call("GET", f"/entities/{ids[name]}") for name in relations["related"]})
    print(f"create: book {book['_id']} with {len(initial)} relations to {len(relations['related'])} entities")
elif phase == "apply":
    ids = load("ids.json")
    try:
        patch = load("patch.json")
        if patch.get("metadata"):
            call("PATCH", f"/entities/{ids['book']}/metadata", patch["metadata"])
        if patch.get("relations"):
            call(patch["relationsMethod"], f"/entities/{ids['book']}/relations", patch["relations"])
        after = {"book": call("GET", f"/entities/{ids['book']}")}
        for name in load("relations.json")["related"]:
            after[name] = call("GET", f"/entities/{ids[name]}")
        save("after.json", after)
        print(f"apply: metadata {len(patch.get('metadata') or [])}, relations {patch.get('relationsMethod')} {len(patch.get('relations') or [])}")
    finally:
        for entity_id in ids.values():
            try:
                call("DELETE", f"/entities/{entity_id}")
            except Exception as error:  # keep cleaning up
                print(f"cleanup {entity_id}: {error}")
