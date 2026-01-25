import { betterAuth } from "better-auth";
import { phoneNumber, username } from "better-auth/plugins";
import { createClient } from "@convex-dev/better-auth";
import { convex } from "@convex-dev/better-auth/plugins";
import { components } from "./_generated/api";
import authConfig from "./auth.config";

export const authComponent = createClient(components.auth);

/**
 * Helper to get the Better Auth instance within a Convex context.
 * Uses the component's adapter to interact with the Convex database.
 */
export const getAuth = (ctx: any) => betterAuth({
    database: authComponent.adapter(ctx),
    baseURL: process.env.CONVEX_SITE_URL || "http://localhost:3210/http/api/auth",
    secret: process.env.BETTER_AUTH_SECRET,
    trustedOrigins: [
        "http://localhost:8081",
        "http://127.0.0.1:8081",
    ],
    advanced: {
        defaultCookieAttributes: {
            sameSite: "none",
            secure: true,
        }
    },
    emailAndPassword: {
        enabled: true,
    },
    plugins: [
        phoneNumber(),
        username(),
        convex({ authConfig })
    ]
});

// For backward compatibility
export const auth = {
    handler: async (_request: Request) => {
        return new Response("Not implemented - use getAuth(ctx)", { status: 501 });
    }
};
