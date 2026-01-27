import { httpRouter } from "convex/server";

import { authComponent, getAuth } from "./auth";

const http = httpRouter();

// Register all Better Auth routes (GET, POST, OPTIONS) with built-in CORS support
authComponent.registerRoutes(http, getAuth, {
    cors: {
        allowedOrigins: ["*"], // Adjust as needed for production
    }
});

export default http;
