import { createAuthClient } from "better-auth/client";

export class AuthAdapter {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    private client: any;

    constructor(baseURL: string) {
        this.client = createAuthClient({
            baseURL
        });
    }

    async signInWithPhone(phoneNumber: string): Promise<void> {
        await this.client.signIn.phone({
            phoneNumber
        });
    }

    async verifyOTP(phoneNumber: string, otp: string): Promise<void> {
        await this.client.signIn.phone({
            phoneNumber,
            otp
        });
    }

    async signUpWithEmail(email: string, password: string, name: string): Promise<void> {
        await this.client.signUp.email({
            email,
            password,
            name
        });
    }

    async signInWithEmail(email: string, password: string): Promise<void> {
        await this.client.signIn.email({
            email,
            password
        });
    }
}
