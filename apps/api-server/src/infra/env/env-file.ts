import path from "node:path";
import { config } from "dotenv";

const requiredServerEnvKeys = [
    "PORT",
    "NODE_ENV",
    "NMM_WEB_ORIGIN",
    "NMM_AUTH_SECRET",
    "NMM_AUTH_BASE_URL",
    "NMM_DB_HOST",
    "NMM_DB_PORT",
    "NMM_DB_USERNAME",
    "NMM_DB_PASSWORD",
    "NMM_DB_DATABASE",
    "NMM_DB_SYNCHRONIZE",
    "NMM_DB_LOGGING"
] as const;

const defaultEnvFilePath = path.resolve(__dirname, "../../../.env");

export function loadServerEnv() {
    const envFilePath = process.env.NMM_ENV_FILE
        ? path.resolve(process.cwd(), process.env.NMM_ENV_FILE)
        : defaultEnvFilePath;
    const result = config({ path: envFilePath, override: true });

    if (result.error && !hasRequiredServerEnv()) {
        throw new Error(`Server environment file is required: ${envFilePath}`);
    }
}

function hasRequiredServerEnv() {
    return requiredServerEnvKeys.every((key) => Boolean(process.env[key]));
}
