export interface AuthSession {
  id: string;
  userId: string;
  token: string;
  expiresAt: Date;
  revokedAt?: Date;
}

export interface IdentityAccount {
  id: string;
  userId: string;
  provider: string;
  providerAccountId: string;
}
