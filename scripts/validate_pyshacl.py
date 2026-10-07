"""Second-opinion validation of *.ui.ttl declarations with pySHACL (CI).

The ontology is merged into the data graph so sh:class checks see the
enumeration instances; the meta-shapes are the shapes graph. SHACL Core only,
so the result must match `elody-ui validate` (rdf-validate-shacl).

usage: python scripts/validate_pyshacl.py DECLARATION.ui.ttl [...]
"""
import os
import sys
from pathlib import Path

from pyshacl import validate
from rdflib import Graph

ROOT = Path(__file__).resolve().parent.parent
# the vocabulary and meta-shapes live in elody-ontology (ui/): ELODY_ONTOLOGY, else the root of elody-common
VOCABULARY_DIR = Path(os.environ.get("ELODY_ONTOLOGY") or ROOT.parent.parent / "elody-ontology") / "ui"
ONTOLOGY = VOCABULARY_DIR / "elody-ui.ttl"
SHAPES = VOCABULARY_DIR / "elody-ui.shapes.ttl"


def main(paths):
    shapes = Graph().parse(SHAPES)
    failed = 0
    for path in paths:
        text = Path(path).read_text()
        if "https://elody.io/ns/ui#" in text or "http://www.w3.org/ns/shacl-ui#" in text:
            print(f"{path}: legacy namespace — run `elody-ui migrate` first")
            failed += 1
            continue
        data = Graph().parse(ONTOLOGY).parse(data=text, format="turtle")
        conforms, _, report = validate(data, shacl_graph=shapes, inference="none")
        if conforms:
            print(f"{path} conforms")
        else:
            failed += 1
            messages = sorted({line.strip() for line in report.splitlines() if line.strip().startswith("Message:")})
            print(f"{path}: {len(messages)} distinct violation(s)")
            for message in messages:
                print(f"  {message}")
    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
