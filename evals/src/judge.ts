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

interface PersonaSpec extends Persona {
  negative?: boolean;
}

const COLORS: { name: string[]; label: string }[] = [
  { name: ['black'], label: 'black' },
  { name: ['navy blue', 'blue'], label: 'navy' },
  { name: ['blue'], label: 'blue' },
  { name: ['pink'], label: 'pink' },
  { name: ['maroon'], label: 'maroon' },
  { name: ['green', 'olive', 'lime green'], label: 'green' },
  { name: ['red', 'maroon'], label: 'red' },
  { name: ['white', 'off white'], label: 'white' },
  { name: ['yellow', 'mustard'], label: 'yellow' },
  { name: ['purple', 'violet', 'lavender', 'mauve'], label: 'purple' },
  { name: ['teal'], label: 'teal' },
  { name: ['beige', 'cream', 'off white'], label: 'beige' },
  { name: ['grey', 'charcoal'], label: 'grey' },
  { name: ['orange', 'rust'], label: 'orange' },
];

const STYLE_KEYWORDS: { label: string; words: string[] }[] = [
  { label: 'printed', words: ['printed'] },
  { label: 'floral', words: ['floral', 'printed', 'motif'] },
  { label: 'embroidered', words: ['embroidered', 'embroidery', 'ethnic'] },
  { label: 'sequin', words: ['sequin'] },
  { label: 'solid', words: ['solid', 'straight'] },
];

const OCCASIONS = ['for daily wear', 'for office', 'for parties', 'for festive functions', 'for summer', 'for college'];

const COLOR_TEMPLATES = [
  (c: string, s: string, o: string) => `${c} ${s} kurta ${o}`,
  (c: string, s: string, o: string) => `looking for a ${c} ${s} kurta ${o}`,
  (c: string, s: string, o: string) => `${s} kurta in ${c} ${o}`,
  (c: string, s: string, o: string) => `show me ${c} kurtas, ${s} style ${o}`,
  (c: string, s: string, o: string) => `${c} ${s} kurta with a simple design ${o}`,
  (c: string, s: string, o: string) => `${c} ${s} kurta ${o} in dark shades`,
];

const HINGLISH_COLORS: { en: string[]; hi: string }[] = [
  { en: ['black'], hi: 'kaale rang ki' },
  { en: ['pink'], hi: 'gulabi' },
  { en: ['blue'], hi: 'neele rang ki' },
  { en: ['red', 'maroon'], hi: 'laal rang ki' },
  { en: ['green', 'olive', 'lime green'], hi: 'hare rang ki' },
  { en: ['white', 'off white'], hi: 'safed' },
  { en: ['yellow', 'mustard'], hi: 'peele rang ki' },
  { en: ['purple', 'violet', 'lavender', 'mauve'], hi: 'baingani' },
];

const HINGLISH_TEMPLATES = [
  (c: string, s: string) => `${c} casual kurti roz pehnne ke liye ${s}`,
  (c: string, s: string) => `${c} ${s} printed kurta garmi ke liye`,
  (c: string, s: string) => `shaadi ke liye ${c} ${s} kurta dikhao`,
];

/** Intents with nothing relevant in a women's-ethnic corpus. Scored on abstention, never recall. */
const NEGATIVES: { id: string; text: string }[] = [
  { id: 'n-mens-shirt', text: "men's formal shirt for office" },
  { id: 'n-mens-jeans', text: 'blue denim jeans for men' },
  { id: 'n-mens-jacket', text: "men's leather biker jacket" },
  { id: 'n-mens-shoes', text: "men's running sneakers" },
  { id: 'n-mens-sherwani', text: "groom's wedding sherwani for men" },
  { id: 'n-mens-blazer', text: "men's navy blazer for interviews" },
  { id: 'n-mens-shorts', text: "men's gym shorts" },
  { id: 'n-kids', text: 'kids party wear for a 5 year old' },
  { id: 'n-kids-girl', text: 'baby girl frock in pink' },
  { id: 'n-saree-silk', text: 'kanjivaram silk saree for wedding' },
  { id: 'n-saree-cotton', text: 'daily wear cotton saree' },
  { id: 'n-lehenga', text: 'bridal lehenga in red and gold' },
  { id: 'n-gown-western', text: 'evening bodycon gown for cocktail party' },
  { id: 'n-handbag', text: 'leather handbag for women' },
  { id: 'n-watch', text: 'analog wrist watch for men' },
  { id: 'n-swimwear', text: "women's swimsuit for Goa trip" },
  { id: 'n-winter-coat', text: 'woolen overcoat for Manali winter' },
  { id: 'n-nightwear', text: "women's satin night suit" },
  { id: 'n-activewear', text: "women's gym leggings with pockets" },
  { id: 'n-palazzo', text: 'flared palazzo pants in white' },
  { id: 'n-skirt', text: 'pleated midi skirt for office' },
  { id: 'n-jumpsuit', text: 'denim jumpsuit for women' },
  { id: 'n-anarkali', text: 'floor length anarkali in royal blue' },
  { id: 'n-kaftan', text: 'beach kaftan dress in white' },
  { id: 'n-dhoti', text: "men's dhoti kurta set for pooja" },
  { id: 'n-pathani', text: "men's black pathani suit" },
  { id: 'n-kurta-men', text: 'plain white kurta for men for Eid' },
  { id: 'n-shoes-heels', text: 'block heels for women in nude shade' },
  { id: 'n-jewellery', text: 'gold jhumka earrings for festive look' },
  { id: 'n-bedsheet', text: 'king size cotton bedsheet' },
];

function buildPersonas(): PersonaSpec[] {
  const personas: PersonaSpec[] = [];
  const seen = new Set<string>();
  const add = (p: PersonaSpec): void => {
    if (seen.has(p.id)) return;
    seen.add(p.id);
    personas.push(p);
  };
  for (const color of COLORS) {
    for (const style of STYLE_KEYWORDS) {
      COLOR_TEMPLATES.forEach((tpl, i) => {
        add({
          id: `q-${color.label}-${style.label}-t${i}`,
          text: tpl(color.label, style.label, OCCASIONS[(COLORS.indexOf(color) + STYLE_KEYWORDS.indexOf(style) + i) % OCCASIONS.length] as string),
          color: color.name,
          keywords: style.words,
          category: [],
        });
      });
    }
  }
  const styleOnlyTexts: [string, string][] = [
    ['floral print kurtas with pretty flowers', 'floral'],
    ['shiny sequinned kurta for parties', 'sequin'],
    ['embroidered ethnic kurta with thread work', 'embroidered'],
    ['straight solid kurta, plain minimal office wear', 'solid'],
    ['kurta with ethnic motifs and traditional print', 'motif'],
    ['kurta with notch neck design', 'notch'],
  ];
  styleOnlyTexts.forEach(([text, label], i) => {
    add({ id: `q-style-${label}-${i}`, text, color: [], keywords: [label], category: [] });
  });
  add({ id: 'q-kurta-sets', text: 'matching kurta sets, co-ord ethnic sets', color: [], keywords: [], category: ['kurta sets'] });
  for (const hi of HINGLISH_COLORS) {
    HINGLISH_TEMPLATES.forEach((tpl, i) => {
      add({
        id: `q-hi-${hi.hi.split(' ')[0]}-${i}`,
        text: tpl(hi.hi, i === 2 ? 'ethnic' : 'printed'),
        color: hi.en,
        keywords: ['printed', 'solid', 'straight', 'casual'],
        category: [],
      });
    });
  }
  return personas;
}

const PERSONAS: PersonaSpec[] = buildPersonas();

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
for (const neg of NEGATIVES) {
  queries.push({
    id: neg.id,
    text: neg.text,
    relevantIds: [],
    requiredAttrs: { color: [], occasion: [], fit: [] },
    negative: true,
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
for (const q of queries as { id: string; _rule?: { level: number; hits: number } }[]) {
  console.log(
    q._rule
      ? `  ${q.id}: rule-level=${q._rule.level} relevants=${q._rule.hits}`
      : `  ${q.id}: negative (abstention-scored)`,
  );
}
