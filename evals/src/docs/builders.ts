import type { DocBuilder, EvalProduct } from '../types.js';

const titleOnly: DocBuilder = {
  id: 'title-only',
  build: (p: EvalProduct): string => p.title,
};

const titleBrand: DocBuilder = {
  id: 'title-brand',
  build: (p: EvalProduct): string => `${p.title} ${p.brand}`.trim(),
};

const titleBrandDesc: DocBuilder = {
  id: 'title-brand-desc',
  build: (p: EvalProduct): string => `${p.title} ${p.brand} ${p.description}`.trim(),
};

/**
 * Canonical: mirrors packages/infrastructure EmbedderAdapter
 * formatProductForEmbedding (keep in sync — see evals README).
 */
const canonical: DocBuilder = {
  id: 'canonical',
  build: (p: EvalProduct): string => {
    const parts: string[] = [];
    if (p.title) parts.push(p.title);
    if (p.brand) parts.push(p.brand);
    if (p.description) parts.push(p.description);
    const attrs = p.attributes;
    for (const key of ['material', 'fabric', 'color', 'fit', 'occasion', 'pattern']) {
      const value = attrs[key];
      if (typeof value === 'string' && value) parts.push(value);
      else if (Array.isArray(value)) parts.push(value.map(String).join(' '));
    }
    return parts.join(' ').trim();
  },
};

/** Field-tagged layout: tests whether explicit structure beats flat joins. */
const tagged: DocBuilder = {
  id: 'tagged',
  build: (p: EvalProduct): string =>
    [
      `title: ${p.title}`,
      `brand: ${p.brand}`,
      p.description ? `description: ${p.description}` : '',
      p.color ? `color: ${p.color}` : '',
      p.fit ? `fit: ${p.fit}` : '',
      p.occasion.length > 0 ? `occasion: ${p.occasion.join(', ')}` : '',
      `category: ${p.category}`,
    ]
      .filter(Boolean)
      .join('. '),
};

/** Color-weighted: repeats the color token to test emphasis effects. */
const colorWeighted: DocBuilder = {
  id: 'color-weighted',
  build: (p: EvalProduct): string =>
    `${canonical.build(p)} ${p.color} ${p.color}`.trim(),
};

/** No-description ablation: attributes only, isolates attribute signal. */
const attrsOnly: DocBuilder = {
  id: 'attrs-only',
  build: (p: EvalProduct): string => {
    const attrs = p.attributes;
    const parts: string[] = [p.title];
    for (const key of ['material', 'fabric', 'color', 'fit', 'occasion', 'pattern']) {
      const value = attrs[key];
      if (typeof value === 'string' && value) parts.push(value);
      else if (Array.isArray(value)) parts.push(value.map(String).join(' '));
    }
    return parts.join(' ').trim();
  },
};

export const docBuilders: DocBuilder[] = [
  titleOnly,
  titleBrand,
  titleBrandDesc,
  canonical,
  tagged,
  colorWeighted,
  attrsOnly,
];
