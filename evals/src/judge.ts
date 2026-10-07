/**
 * Generates judgments.v1.json from persona rules over a pinned corpus.
 *
 * WEAK LABELS (documented, not hidden): relevantIds = products matching the
 * persona's attribute rule (color + title keywords + category). This measures
 * exactly the failure you reported ("dark + casual ignored") and keeps
 * model/layout comparisons fair — every config is scored against the same
 * labels. Human-pooled judging is the planned v2 upgrade (see README).
 *
 * Relaxation is automatic and recorded per query: level0 (color+keywords+
 * category) -> level1 (color+keywords) -> level2 (color only). First level
 * with >= minRelevants wins; queries that never reach it are dropped.
 *
 * Usage:
 *   mise run evals:judge
 */
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';

import type { EvalProduct } from './types.js';

import { readArg, resolveOut } from './cli.js';
import { loadCorpus } from './corpus.js';

interface Persona {
  id: string;
  text: string;
  color: string[];
  keywords: string[];
  category: string[];
}

const PERSONAS: Persona[] = [
  { id: 'q-black-casual', text: 'black casual kurta for daily wear in dark colors', color: ['black'], keywords: ['casual', 'daily', 'straight', 'solid', 'printed'], category: [] },
  { id: 'q-navy-dark', text: 'dark navy blue kurta, simple and casual', color: ['navy blue', 'blue'], keywords: ['casual', 'solid', 'straight', 'printed'], category: [] },
  { id: 'q-blue-printed', text: 'blue printed kurta with floral design', color: ['blue'], keywords: ['printed', 'floral', 'motif'], category: [] },
  { id: 'q-pink-floral', text: 'pink floral printed kurta for summer', color: ['pink'], keywords: ['floral', 'printed', 'motif'], category: [] },
  { id: 'q-maroon-ethnic', text: 'maroon ethnic kurta with embroidery for festive occasions', color: ['maroon'], keywords: ['embroidered', 'embroidery', 'ethnic', 'motif', 'printed'], category: [] },
  { id: 'q-green-casual', text: 'green casual kurta for everyday wear', color: ['green', 'olive', 'lime green'], keywords: ['casual', 'printed', 'solid', 'straight'], category: [] },
  { id: 'q-red-festive', text: 'red kurta for festive and wedding functions', color: ['red', 'maroon'], keywords: ['embroidered', 'embroidery', 'festive', 'ethnic', 'printed', 'motif'], category: [] },
  { id: 'q-white-office', text: 'white solid kurta for office, minimal look', color: ['white', 'off white'], keywords: ['solid', 'straight', 'notch', 'casual'], category: [] },
  { id: 'q-yellow-festive', text: 'yellow mustard kurta for haldi and festive functions', color: ['yellow', 'mustard'], keywords: ['printed', 'embroidered', 'festive', 'ethnic', 'motif'], category: [] },
  { id: 'q-purple-party', text: 'purple kurta with sequin work for evening events', color: ['purple', 'violet', 'lavender', 'mauve'], keywords: ['sequin', 'embroidered', 'printed', 'solid'], category: [] },
  { id: 'q-teal-printed', text: 'teal printed kurta in a fresh color', color: ['teal'], keywords: ['printed', 'floral', 'motif', 'solid'], category: [] },
  { id: 'q-beige-minimal', text: 'beige minimal kurta, solid and simple', color: ['beige', 'cream', 'off white'], keywords: ['solid', 'straight', 'casual'], category: [] },
  { id: 'q-floral', text: 'floral print kurtas with pretty flowers', color: [], keywords: ['floral'], category: [] },
  { id: 'q-sequin', text: 'shiny sequinned kurta for parties and night events', color: [], keywords: ['sequin'], category: [] },
  { id: 'q-embroidered', text: 'embroidered ethnic kurta with thread work', color: [], keywords: ['embroidered', 'embroidery'], category: [] },
  { id: 'q-straight-solid', text: 'straight solid kurta, plain minimal office wear', color: [], keywords: ['straight', 'solid'], category: [] },
  { id: 'q-motif', text: 'kurta with ethnic motifs and traditional print', color: [], keywords: ['motif', 'ethnic'], category: [] },
  { id: 'q-kurta-sets', text: 'matching kurta sets, co-ord ethnic sets', color: [], keywords: [], category: ['kurta sets'] },
  { id: 'q-kurtas-only', text: 'single kurtas, not sets, everyday styles', color: [], keywords: ['printed', 'solid', 'floral', 'casual'], category: ['kurtas'] },
  { id: 'q-notch-neck', text: 'kurta with notch neck design', color: [], keywords: ['notch'], category: [] },
  { id: 'q-pink-casual', text: 'pink casual kurta for daily college wear', color: ['pink', 'peach'], keywords: ['casual', 'printed', 'solid'], category: [] },
  { id: 'q-grey-minimal', text: 'grey minimal kurta in neutral shade', color: ['grey', 'charcoal'], keywords: ['solid', 'straight', 'casual', 'printed'], category: [] },
  { id: 'q-orange-printed', text: 'orange printed kurta, bright and cheerful', color: ['orange', 'rust'], keywords: ['printed', 'floral', 'motif'], category: [] },
  { id: 'q-anouk', text: 'Anouk brand kurtas with elegant designs', color: [], keywords: ['printed', 'floral', 'embroidered', 'solid'], category: [] },
  { id: 'q-hinglish-dark', text: 'kaale rang ki casual kurti roz pehnne ke liye', color: ['black'], keywords: ['casual', 'printed', 'solid', 'straight'], category: [] },
  { id: 'q-hinglish-floral', text: 'gulabi floral printed kurta garmi ke liye', color: ['pink'], keywords: ['floral', 'printed'], category: [] },
];

function matches(product: EvalProduct, persona: Persona, level: number): boolean {
  if (persona.color.length > 0 && !persona.color.includes(product.color)) return false;
  if (level <= 1 && persona.keywords.length > 0) {
    const title = product.title.toLowerCase();
    const anyKeyword = persona.keywords.some((k) => title.includes(k));
    if (level === 0) {
      if (!anyKeyword) return false;
    } else if (!anyKeyword) return false;
  }
  if (level === 0 && persona.category.length > 0) {
    if (!persona.category.includes(product.category.toLowerCase())) return false;
  }
  return true;
}

const corpusPath = readArg(process.argv, '--corpus') || 'data/corpus.v1.jsonl';
const outPath = readArg(process.argv, '--out') || 'data/judgments.v1.json';
const minRelevants = Number(readArg(process.argv, '--min') || '5');

const corpus = loadCorpus(corpusPath);
const corpusHash = createHash('sha1').update(readFileSync(corpusPath)).digest('hex').slice(0, 12);

const queries = [];
const dropped: string[] = [];
for (const persona of PERSONAS) {
  let picked: EvalProduct[] = [];
  let usedLevel = -1;
  for (const level of [0, 1, 2]) {
    const hits = corpus.filter((p) => matches(p, persona, level));
    if (hits.length >= minRelevants) {
      picked = hits;
      usedLevel = level;
      break;
    }
  }
  if (usedLevel < 0) {
    dropped.push(`${persona.id} (too-thin)`);
    continue;
  }
  if (picked.length > 0.6 * corpus.length) {
    dropped.push(`${persona.id} (too-broad:${picked.length})`);
    continue;
  }
  queries.push({
    id: persona.id,
    text: persona.text,
    relevantIds: picked.map((p) => p.id),
    requiredAttrs: { color: persona.color, occasion: [], fit: [] },
    _rule: { level: usedLevel, hits: picked.length },
  });
}

const payload = {
  meta: {
    generator: 'evals/src/judge.ts',
    weakLabels: true,
    corpus: corpusPath,
    corpusHash,
    minRelevants,
    dropped,
  },
  queries,
};

const resolved = resolveOut(outPath);
writeFileSync(resolved, JSON.stringify(payload, null, 1));
console.log(`Wrote ${queries.length} queries (dropped ${dropped.length}: ${dropped.join(', ') || 'none'}) -> ${resolved}`);
for (const q of queries as { id: string; _rule: { level: number; hits: number } }[]) {
  console.log(`  ${q.id}: rule-level=${q._rule.level} relevants=${q._rule.hits}`);
}
