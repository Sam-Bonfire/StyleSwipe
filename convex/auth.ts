import { createClient } from "@convex-dev/better-auth";
import { convex } from "@convex-dev/better-auth/plugins";
import { betterAuth } from "better-auth";
import { phoneNumber, username } from "better-auth/plugins";

import { components } from "./_generated/api";
import authConfig from "./auth.config";

export const authComponent = createClient(components.auth, {
    verbose: true,
});

/**
 * Helper to get the Better Auth instance within a Convex context.
 * Uses the component's adapter to interact with the Convex database.
 */
export const getAuth = (ctx: any) => betterAuth({
    database: authComponent.adapter(ctx),
    // @ts-ignore
    baseURL: "http://localhost:3211",
    trustedOrigins: [
        "http://localhost:8081",
        "http://127.0.0.1:8081",
        "http://localhost:8082",
        "http://127.0.0.1:8082",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "chrome-extension://*",
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

