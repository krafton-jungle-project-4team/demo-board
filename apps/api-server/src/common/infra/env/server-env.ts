import type { DatabaseEnv } from "../database";
import type { AuthEnv, GitHubOAuthEnv } from "../../../features/auth/domain";
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
    const nodeEnv = readStringEnv("NODE_ENV");

    return {
        app: {
            port: readNumberEnv("PORT"),
            webOrigin: readStringEnv("NMM_WEB_ORIGIN"),
            nodeEnv
        },
        database: {
            host: readStringEnv("NMM_DB_HOST"),
            port: readNumberEnv("NMM_DB_PORT"),
            username: readStringEnv("NMM_DB_USERNAME"),
            password: readStringEnv("NMM_DB_PASSWORD"),
            database: readStringEnv("NMM_DB_DATABASE"),
            synchronize: readBooleanEnv("NMM_DB_SYNCHRONIZE"),
            logging: readBooleanEnv("NMM_DB_LOGGING"),
            manualInitialization: readBooleanEnv("NMM_DB_MANUAL_INITIALIZATION")
        },
        auth: {
            secret: readStringEnv("NMM_AUTH_SECRET"),
            webOrigin: readStringEnv("NMM_WEB_ORIGIN"),
            signupRedirectPath: readStringEnv("NMM_AUTH_SIGNUP_REDIRECT_PATH"),
            errorRedirectPath: readStringEnv("NMM_AUTH_ERROR_REDIRECT_PATH"),
            sessionCookieSecure: readBooleanEnv("NMM_AUTH_COOKIE_SECURE")
        },
        githubOAuth: {
            apiOrigin: readStringEnv("NMM_API_ORIGIN"),
            clientId: readStringEnv("NMM_OAUTH_GITHUB_CLIENT_ID"),
            clientSecret: readStringEnv("NMM_OAUTH_GITHUB_CLIENT_SECRET")
        }
    };
}

function readStringEnv(key: string) {
    const value = process.env[key];

    if (!value) {
        throw new Error(`Required environment variable is missing: ${key}`);
    }

    return value;
}

function readBooleanEnv(key: string) {
    const value = readStringEnv(key);

    if (value === "true") {
        return true;
    }

    if (value === "false") {
        return false;
    }

    throw new Error(`Boolean environment variable is invalid: ${key}`);
}

function readNumberEnv(key: string) {
    const parsedValue = Number(readStringEnv(key));

    if (!Number.isFinite(parsedValue)) {
        throw new Error(`Number environment variable is invalid: ${key}`);
    }

    return parsedValue;
}
