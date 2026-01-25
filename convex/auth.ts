import { betterAuth } from "better-auth";
import { phone, username } from "better-auth/plugins";

export const auth = betterAuth({
    plugins: [
        phone(),
        username()
    ]
});
