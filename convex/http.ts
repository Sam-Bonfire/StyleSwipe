import { httpRouter } from "convex/server";
import { auth } from "./auth";

const http = httpRouter();

http.route({
    pathPrefix: "/api/auth",
    method: "POST",
    handler: async (request) => {
        return auth.handler(request);
    },
});

http.route({
    pathPrefix: "/api/auth",
    method: "GET",
    handler: async (request) => {
        return auth.handler(request);
    },
});

export default http;
