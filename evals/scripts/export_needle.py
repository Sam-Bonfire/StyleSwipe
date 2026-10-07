"""Embed texts.jsonl lines with Cactus Needle and write vectors for the eval harness.

Reads data/external/texts.jsonl ({key, text} per line, from `texts`),
embeds each with needle.Needle().embed, writes
data/external/needle3-20L.json ({dims, version, vectors: {key: [...]}}).

Usage:
  python evals/scripts/export_needle.py
"""
import hashlib
import json
import os

import needle

BASE = os.path.join(os.path.dirname(__file__), '..', 'data', 'external')

with open(os.path.join(BASE, 'texts.jsonl'), encoding='utf-8') as f:
    rows = [json.loads(line) for line in f if line.strip()]

agent = needle.Needle()
vectors = {}
dims = 0
for row in rows:
    vector = agent.embed(row['text'])
    dims = len(vector)
    vectors[row['key']] = vector
    if len(vectors) % 500 == 0:
        print(f'embedded {len(vectors)}/{len(rows)} (dims={dims})')

out = {'dims': dims, 'version': 'needle3-20L', 'vectors': vectors}
with open(os.path.join(BASE, 'needle3-20L.json'), 'w', encoding='utf-8') as f:
    json.dump(out, f)
print(f'wrote {len(vectors)} vectors dims={dims} (native, unnormalized)')
