import type { DatabaseEnv } from "../database";
import type { AuthEnv, GitHubOAuthEnv } from "../../features/auth/domain";
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

loadServerEnv();

export const serverEnv: ServerEnv = createServerEnv();

function createServerEnv(): ServerEnv {
    const nodeEnv = readStringEnv("NODE_ENV", "development");

    return {
        app: {
            port: readNumberEnv("PORT", 3000),
            webOrigin: readStringEnv("NMM_WEB_ORIGIN", "http://localhost:5173"),
            nodeEnv
        },
        database: {
            host: readStringEnv("NMM_DB_HOST", "localhost"),
            port: readNumberEnv("NMM_DB_PORT", 5432),
            username: readStringEnv("NMM_DB_USERNAME", "namanmu"),
            password: readStringEnv("NMM_DB_PASSWORD", "1234"),
            database: readStringEnv("NMM_DB_DATABASE", "namanmu"),
            synchronize: readBooleanEnv("NMM_DB_SYNCHRONIZE", nodeEnv !== "production"),
            logging: readBooleanEnv("NMM_DB_LOGGING", false),
            manualInitialization: readBooleanEnv("NMM_DB_MANUAL_INITIALIZATION", false)
        },
        auth: {
            secret: readRequiredStringEnv("NMM_AUTH_SECRET"),
            webOrigin: readStringEnv("NMM_WEB_ORIGIN", "http://localhost:5173"),
            signupRedirectPath: readStringEnv("NMM_AUTH_SIGNUP_REDIRECT_PATH", "/auth/complete-signup"),
            errorRedirectPath: readStringEnv("NMM_AUTH_ERROR_REDIRECT_PATH", "/auth/error"),
            sessionCookieSecure: readBooleanEnv("NMM_AUTH_COOKIE_SECURE", false)
        },
        githubOAuth: {
            apiOrigin: readStringEnv("NMM_API_ORIGIN", "http://localhost:3000"),
            clientId: readRequiredStringEnv("NMM_OAUTH_GITHUB_CLIENT_ID"),
            clientSecret: readRequiredStringEnv("NMM_OAUTH_GITHUB_CLIENT_SECRET")
        }
    };
}

function readRequiredStringEnv(key: string) {
    const value = process.env[key];

    if (!value) {
        throw new Error(`Required environment variable is missing: ${key}`);
    }

    return value;
}

function readStringEnv(key: string, defaultValue: string) {
    return process.env[key] ?? defaultValue;
}

function readBooleanEnv(key: string, defaultValue: boolean) {
    const value = process.env[key];

    if (value === undefined) {
        return defaultValue;
    }

    return value === "true";
}

function readNumberEnv(key: string, defaultValue: number) {
    const value = process.env[key];

    if (value === undefined) {
        return defaultValue;
    }

    const parsedValue = Number(value);

    return Number.isFinite(parsedValue) ? parsedValue : defaultValue;
}
