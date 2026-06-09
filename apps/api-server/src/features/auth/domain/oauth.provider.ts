export const AUTH_OAUTH_PROVIDER = Symbol("AUTH_OAUTH_PROVIDER");

export type OAuthProviderProfile = {
    provider: "github";
    providerAccountId: string;
    login: string;
    name: string | null;
    email: string | null;
    avatarUrl: string | null;
};

export type OAuthProviderEmail = {
    email: string;
    primary: boolean;
    verified: boolean;
};

export type OAuthProviderFailure =
    | "ACCESS_TOKEN_UNAVAILABLE"
    | "PROFILE_UNAVAILABLE"
    | "EMAIL_UNAVAILABLE"
    | "VERIFIED_EMAIL_UNAVAILABLE"
    | "RESPONSE_INVALID";

export class OAuthProviderError extends Error {
    constructor(readonly failure: OAuthProviderFailure) {
        super(failure);
        this.name = "OAuthProviderError";
    }
}

export type OAuthProvider = {
    createAuthorizationUrl(input: { state: string }): string;
    exchangeCode(code: string): Promise<string>;
    fetchProfile(accessToken: string): Promise<OAuthProviderProfile>;
    fetchEmails(accessToken: string): Promise<OAuthProviderEmail[]>;
    pickVerifiedEmail(profile: OAuthProviderProfile, emails: OAuthProviderEmail[]): string;
};
