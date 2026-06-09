import { Injectable } from "@nestjs/common";
import { serverEnv } from "../../../common/env";
import { OAuthProviderError, type OAuthProvider, type OAuthProviderEmail, type OAuthProviderProfile } from "../domain";

@Injectable()
export class GitHubOAuthClient implements OAuthProvider {
    createAuthorizationUrl(input: { state: string }) {
        const config = this.getOAuthConfig();
        const authorizationUrl = new URL("https://github.com/login/oauth/authorize");

        authorizationUrl.searchParams.set("client_id", config.clientId);
        authorizationUrl.searchParams.set("redirect_uri", config.callbackUrl);
        authorizationUrl.searchParams.set("scope", "read:user user:email");
        authorizationUrl.searchParams.set("state", input.state);

        return authorizationUrl.toString();
    }

    async exchangeCode(code: string) {
        const config = this.getOAuthConfig();
        const response = await fetch("https://github.com/login/oauth/access_token", {
            method: "POST",
            headers: {
                Accept: "application/json",
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                client_id: config.clientId,
                client_secret: config.clientSecret,
                code,
                redirect_uri: config.callbackUrl
            })
        });
        const tokenResponse = await this.readJsonObject(response);
        const accessToken = this.readString(tokenResponse, "access_token");

        if (!response.ok || !accessToken) {
            throw new OAuthProviderError("ACCESS_TOKEN_UNAVAILABLE");
        }

        return accessToken;
    }

    async fetchProfile(accessToken: string): Promise<OAuthProviderProfile> {
        const response = await this.fetchGitHubApi("https://api.github.com/user", accessToken);
        const profile = await this.readJsonObject(response);
        const id = this.readNumber(profile, "id");
        const login = this.readString(profile, "login");

        if (!response.ok || id === undefined || !login) {
            throw new OAuthProviderError("PROFILE_UNAVAILABLE");
        }

        return {
            provider: "github",
            providerAccountId: String(id),
            login,
            name: this.readString(profile, "name") ?? null,
            email: this.readString(profile, "email") ?? null,
            avatarUrl: this.readString(profile, "avatar_url") ?? null
        };
    }

    async fetchEmails(accessToken: string): Promise<OAuthProviderEmail[]> {
        const response = await this.fetchGitHubApi("https://api.github.com/user/emails", accessToken);
        const data: unknown = await response.json();

        if (!response.ok || !Array.isArray(data)) {
            throw new OAuthProviderError("EMAIL_UNAVAILABLE");
        }

        return data.filter((item): item is OAuthProviderEmail => {
            if (!item || typeof item !== "object" || Array.isArray(item)) {
                return false;
            }

            const record = item as Record<string, unknown>;

            return (
                typeof record.email === "string" &&
                typeof record.primary === "boolean" &&
                typeof record.verified === "boolean"
            );
        });
    }

    pickVerifiedEmail(profile: OAuthProviderProfile, emails: OAuthProviderEmail[]) {
        const primaryEmail = emails.find((email) => email.primary && email.verified);
        const verifiedEmail = primaryEmail ?? emails.find((email) => email.verified);
        const email = verifiedEmail?.email ?? profile.email;

        if (!email) {
            throw new OAuthProviderError("VERIFIED_EMAIL_UNAVAILABLE");
        }

        return email.trim().toLowerCase();
    }

    private getOAuthConfig() {
        return {
            clientId: serverEnv.githubOAuth.clientId,
            clientSecret: serverEnv.githubOAuth.clientSecret,
            callbackUrl: new URL("/api/auth/github/callback", serverEnv.githubOAuth.apiOrigin).toString()
        };
    }

    private fetchGitHubApi(url: string, accessToken: string) {
        return fetch(url, {
            headers: {
                Accept: "application/vnd.github+json",
                Authorization: `Bearer ${accessToken}`,
                "X-GitHub-Api-Version": "2022-11-28"
            }
        });
    }

    private async readJsonObject(response: Response) {
        const data: unknown = await response.json();

        if (!data || typeof data !== "object" || Array.isArray(data)) {
            throw new OAuthProviderError("RESPONSE_INVALID");
        }

        return data as Record<string, unknown>;
    }

    private readString(record: Record<string, unknown>, key: string) {
        const value = record[key];

        return typeof value === "string" && value.length > 0 ? value : undefined;
    }

    private readNumber(record: Record<string, unknown>, key: string) {
        const value = record[key];

        return typeof value === "number" ? value : undefined;
    }
}
