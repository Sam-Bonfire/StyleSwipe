import { createAuthClient } from "better-auth/client";

export class AuthAdapter {
    private client;

    constructor(baseURL: string) {
        this.client = createAuthClient({
            baseURL
        });
    }

    async signInWithPhone(phoneNumber: string) {
        return this.client.signIn.phone({
            phoneNumber
        });
    }

    async verifyOTP(phoneNumber: string, otp: string) {
        // Note: better-auth phone plugin logic might differ, assuming verify flow
        // Or it might be part of signIn if just OTP
        return this.client.signIn.phone({
            phoneNumber,
            otp
        });
    }
}
