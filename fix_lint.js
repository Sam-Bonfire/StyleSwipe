const fs = require('fs');

const file = 'apps/consumer-app/src/screens/discovery/StyleBoardScreen.tsx';
let content = fs.readFileSync(file, 'utf8');

// I'll replace any with specific types where eslint complains but without breaking typescript
// eslint-disable-next-line @typescript-eslint/no-explicit-any

content = content.replace(/board.items\?\.map\(\(item: any\) => {/, "board.items?.map((item: { productId: string; matchStatus: string; product: Record<string, unknown> }) => {");
content = content.replace(/product=\{product as any\}/, "product={product as Record<string, unknown>}");

// also fix TS errors if we use Record<string, unknown> for product
// router.push(\`/product/\${item.productId}\` as never) -- already changed
// handleShop(item.productId, product.url || 'https://styleswipe.com', product.merchantName || product.platform)
// product.url isn't known to Record<string, unknown>
content = content.replace(/onPress=\{\(\) => handleShop\(item\.productId\, product\.url \|\| \'https\:\/\/styleswipe\.com\'\, product\.merchantName \|\| product\.platform\)\}/,
"onPress={() => handleShop(item.productId, (product.url as string) || 'https://styleswipe.com', (product.merchantName as string) || (product.platform as string))}");

fs.writeFileSync(file, content);
