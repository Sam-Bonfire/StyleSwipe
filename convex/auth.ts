import { betterAuth } from "better-auth";
import { phoneNumber, username } from "better-auth/plugins";

export const auth = betterAuth({
    plugins: [
        phoneNumber(),
        username()
    ]
});
