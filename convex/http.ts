import { httpRouter } from "convex/server";
import { auth } from "./auth";
import { httpAction } from "./_generated/server";

const http = httpRouter();

http.route({
    pathPrefix: "/api/auth/",
    method: "POST",
    handler: httpAction(async (_ctx, request) => {
        return auth.handler(request);
    }),
});

http.route({
    pathPrefix: "/api/auth/",
    method: "GET",
    handler: httpAction(async (_ctx, request) => {
        return auth.handler(request);
    }),
});

export default http;
