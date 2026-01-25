import { betterAuth } from "better-auth";
import { phone } from "better-auth/plugins";

export const auth = betterAuth({
    plugins: [
        phone()
    ]
});
