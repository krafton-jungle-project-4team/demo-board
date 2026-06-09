import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

const envFilePath = path.resolve(__dirname, "../../../.env");

export function loadServerEnv() {
    if (!existsSync(envFilePath)) {
        throw new Error(`Server environment file is required: ${envFilePath}`);
    }

    for (const line of readFileSync(envFilePath, "utf8").split(/\r?\n/)) {
        const trimmedLine = line.trim();

        if (!trimmedLine || trimmedLine.startsWith("#")) {
            continue;
        }

        const separatorIndex = trimmedLine.indexOf("=");

        if (separatorIndex < 1) {
            continue;
        }

        const key = trimmedLine.slice(0, separatorIndex).trim();
        const value = stripEnvValue(trimmedLine.slice(separatorIndex + 1).trim());

        process.env[key] ??= value;
    }
}

function stripEnvValue(value: string) {
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
        return value.slice(1, -1);
    }

    return value;
}
