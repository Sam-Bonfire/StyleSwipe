const fs = require('fs');

const file = 'apps/consumer-app/src/screens/discovery/StyleBoardScreen.tsx';
let content = fs.readFileSync(file, 'utf8');

// I'll replace any with specific types where eslint complains but without breaking typescript
// eslint-disable-next-line @typescript-eslint/no-explicit-any

content = content.replace(/import \{ AvatarGroup\, TopBarIconButton\, ProductTile \} from \'\@app\/ui\-kit\'\;/, "import { AvatarGroup, ProductTile, TopBarIconButton } from '@app/ui-kit';");

fs.writeFileSync(file, content);
