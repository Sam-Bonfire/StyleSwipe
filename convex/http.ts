import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";


import { authComponent, getAuth } from "./auth";

const http = httpRouter();

http.route({
    path: "/test-site",
    method: "GET",
    handler: httpAction(async () => {
        return new Response("Site is working", { status: 200 });
    }),
});

// Register all Better Auth routes (GET, POST, OPTIONS) with built-in CORS support
authComponent.registerRoutes(http, getAuth, {
    cors: {
        allowedOrigins: ["*"], // Adjust as needed for production
    }
});

export default http;

