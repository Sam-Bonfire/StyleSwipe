import { ProductSchema } from '../../packages/core/src/catalog/domain/Product';

const baseValidProduct = {
  id: 'prod-123',
  title: 'Classic Denim Jacket',
  brand: 'StyleCo',
  price: 49.99,
  originalMrp: 99.99,
  discountPercentage: 50,
  category: 'Outerwear',
  gender: 'unisex' as const,
  sizes: ['M', 'L'],
  colors: ['Blue'],
  images: ['https://example.com/image1.jpg'],
  embedding: new Array(384).fill(0.1),
  affiliateUrl: 'https://example.com/affiliate/prod-123',
  inStock: true,
};

console.log('--- ProductSchema Stress Testing ---');

function testCase(name: string, payload: any, expectedPass: boolean) {
  const result = ProductSchema.safeParse(payload);
  const passed = result.success === expectedPass;
  console.log(`[${passed ? 'PASS' : 'FAIL'}] ${name}`);
  if (result.success) {
    console.log(`  Parsed successfully: price=${result.data.price}, discount=${result.data.discountPercentage}, embedding.length=${result.data.embedding.length}`);
  } else {
    console.log(`  Rejected as expected with issue count ${result.error.issues.length}:`, result.error.issues.map(i => i.message).join('; '));
  }
  if (!passed) {
    console.error(`  EXPECTATION MISMATCH: Expected success=${expectedPass}, but got ${result.success}`);
  }
  return passed;
}

const tests = [
  // Embedding length tests
  { name: 'Embedding length 383 (expected: FAIL)', payload: { ...baseValidProduct, embedding: new Array(383).fill(0.1) }, expected: false },
  { name: 'Embedding length 384 (expected: PASS)', payload: { ...baseValidProduct, embedding: new Array(384).fill(0.1) }, expected: true },
  { name: 'Embedding length 385 (expected: FAIL)', payload: { ...baseValidProduct, embedding: new Array(385).fill(0.1) }, expected: false },

  // Discount percentage tests
  { name: 'Discount percentage 0 (expected: PASS)', payload: { ...baseValidProduct, discountPercentage: 0 }, expected: true },
  { name: 'Discount percentage 100 (expected: PASS)', payload: { ...baseValidProduct, discountPercentage: 100 }, expected: true },
  { name: 'Discount percentage 100.1 (expected: FAIL)', payload: { ...baseValidProduct, discountPercentage: 100.1 }, expected: false },
  { name: 'Discount percentage -0.1 (expected: FAIL)', payload: { ...baseValidProduct, discountPercentage: -0.1 }, expected: false },

  // Price tests
  { name: 'Price 0 (expected: FAIL)', payload: { ...baseValidProduct, price: 0 }, expected: false },
  { name: 'Price 0.01 (expected: PASS)', payload: { ...baseValidProduct, price: 0.01 }, expected: true },
  { name: 'Price -1 (expected: FAIL)', payload: { ...baseValidProduct, price: -1 }, expected: false },
];

let allPassed = true;
for (const t of tests) {
  const ok = testCase(t.name, t.payload, t.expected);
  if (!ok) allPassed = false;
}

console.log(`\nOverall Boundary Stress Test Outcome: ${allPassed ? 'ALL PASSED' : 'SOME FAILED'}`);
