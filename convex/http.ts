import { httpRouter } from 'convex/server';

import { httpAction } from './_generated/server';
import { authComponent, getAuth } from './auth';

const http = httpRouter();

http.route({
  path: '/test-site',
  method: 'GET',
  handler: httpAction(async () => {
    return new Response('Site is working', { status: 200 });
  }),
});

// Register all Better Auth routes (GET, POST, OPTIONS) with built-in CORS support
(authComponent as any).registerRoutes(http, getAuth, {
  cors: {
    allowedOrigins: [
      'http://localhost:8081',
      'http://127.0.0.1:8081',
      'http://localhost:8082',
      'http://127.0.0.1:8082',
      'http://localhost:5173',
      'http://127.0.0.1:5173',
      '*', // Fallback for debugging, remove in prod
    ],
    allowedHeaders: ['Content-Type', 'Authorization'],
    allowedMethods: ['GET', 'POST', 'OPTIONS', 'PUT', 'DELETE'],
  },
});

export default http;
