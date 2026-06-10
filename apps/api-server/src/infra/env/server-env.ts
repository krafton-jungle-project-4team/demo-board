import { z } from "zod";
import type { DatabaseEnv } from "../database";
import type { AuthEnv, GitHubOAuthEnv } from "../../features/auth/auth.env";
import { loadServerEnv } from "./env-file";

export type AppEnv = {
    port: number;
    webOrigin: string;
    nodeEnv: string;
};

export type ServerEnv = {
    app: AppEnv;
    database: DatabaseEnv;
    auth: AuthEnv;
    githubOAuth: GitHubOAuthEnv;
};

const RequiredStringSchema = z.string().min(1);
const NumberEnvSchema = RequiredStringSchema.transform(Number).pipe(z.number().finite());
const BooleanEnvSchema = z.stringbool({ truthy: ["true"], falsy: ["false"], case: "sensitive" });

const ServerEnvSchema = z.object({
    PORT: NumberEnvSchema,
    NODE_ENV: RequiredStringSchema,
    NMM_WEB_ORIGIN: RequiredStringSchema,
    NMM_DB_HOST: RequiredStringSchema,
    NMM_DB_PORT: NumberEnvSchema,
    NMM_DB_USERNAME: RequiredStringSchema,
    NMM_DB_PASSWORD: RequiredStringSchema,
    NMM_DB_DATABASE: RequiredStringSchema,
    NMM_DB_LOGGING: BooleanEnvSchema,
    NMM_DB_MANUAL_INITIALIZATION: BooleanEnvSchema,
    NMM_AUTH_SECRET: RequiredStringSchema,
    NMM_AUTH_SIGNUP_REDIRECT_PATH: RequiredStringSchema,
    NMM_AUTH_ERROR_REDIRECT_PATH: RequiredStringSchema,
    NMM_AUTH_COOKIE_SECURE: BooleanEnvSchema,
    NMM_API_ORIGIN: RequiredStringSchema,
    NMM_OAUTH_GITHUB_CLIENT_ID: RequiredStringSchema,
    NMM_OAUTH_GITHUB_CLIENT_SECRET: RequiredStringSchema
});

function createServerEnv(): ServerEnv {
    const env = ServerEnvSchema.parse(process.env);

    return {
        app: {
            port: env.PORT,
            webOrigin: env.NMM_WEB_ORIGIN,
            nodeEnv: env.NODE_ENV
        },
        database: {
            host: env.NMM_DB_HOST,
            port: env.NMM_DB_PORT,
            username: env.NMM_DB_USERNAME,
            password: env.NMM_DB_PASSWORD,
            database: env.NMM_DB_DATABASE,
            logging: env.NMM_DB_LOGGING,
            manualInitialization: env.NMM_DB_MANUAL_INITIALIZATION
        },
        auth: {
            secret: env.NMM_AUTH_SECRET,
            webOrigin: env.NMM_WEB_ORIGIN,
            signupRedirectPath: env.NMM_AUTH_SIGNUP_REDIRECT_PATH,
            errorRedirectPath: env.NMM_AUTH_ERROR_REDIRECT_PATH,
            sessionCookieSecure: env.NMM_AUTH_COOKIE_SECURE
        },
        githubOAuth: {
            apiOrigin: env.NMM_API_ORIGIN,
            clientId: env.NMM_OAUTH_GITHUB_CLIENT_ID,
            clientSecret: env.NMM_OAUTH_GITHUB_CLIENT_SECRET
        }
    };
}

loadServerEnv();

export const serverEnv: ServerEnv = createServerEnv();
