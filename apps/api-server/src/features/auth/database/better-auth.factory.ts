import { type DataSource } from "typeorm";
import { serverEnv } from "../../../common/env";

export const BETTER_AUTH = Symbol("BETTER_AUTH");

export type BetterAuth = Awaited<ReturnType<typeof createBetterAuth>>;

export async function createBetterAuth(dataSource: DataSource) {
    const [{ betterAuth }, { typeormAdapter }] = await Promise.all([
        import("better-auth"),
        import("@hedystia/better-auth-typeorm")
    ]);

    return betterAuth({
        appName: "NMM",
        baseURL: serverEnv.githubOAuth.apiOrigin,
        secret: serverEnv.auth.secret,
        trustedOrigins: [serverEnv.app.webOrigin],
        useSecureCookies: serverEnv.auth.sessionCookieSecure,
        database: typeormAdapter(dataSource),
        user: {
            additionalFields: {
                role: {
                    type: "string",
                    required: true,
                    defaultValue: "USER",
                    input: false
                },
                status: {
                    type: "string",
                    required: true,
                    defaultValue: "PENDING",
                    input: false
                }
            }
        },
        socialProviders: {
            github: {
                clientId: serverEnv.githubOAuth.clientId,
                clientSecret: serverEnv.githubOAuth.clientSecret,
                mapProfileToUser: () => ({
                    name: "",
                    role: "USER",
                    status: "PENDING"
                })
            }
        }
    });
}
