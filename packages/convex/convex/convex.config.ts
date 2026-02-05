import { defineApp } from 'convex/server';

import betterAuth from './betterAuth/convex.config';

const app: any = defineApp(); // Explicit any to fix TS2742 portability types
app.use(betterAuth, { name: 'auth' });

export default app;
