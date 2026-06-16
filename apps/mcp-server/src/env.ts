import path from "node:path";
import { fileURLToPath } from "node:url";
import { config } from "dotenv";
import { z } from "zod";

export type McpServerEnv = {
    port: number;
    apiBaseUrl: string;
    bearerToken: string;
    allowedOrigins: string[];
    requestTimeoutMs: number;
};

const moduleDirectory = path.dirname(fileURLToPath(import.meta.url));
const workspaceRoot = path.resolve(moduleDirectory, "../../..");
const defaultEnvFilePath = path.resolve(workspaceRoot, "apps/api-server/.env");

const RequiredStringSchema = z.string().trim().min(1);
const NumberEnvSchema = RequiredStringSchema.transform(Number).pipe(z.number().int().positive());
const OriginListSchema = RequiredStringSchema.transform((value) =>
    value
        .split(",")
        .map((origin) => origin.trim())
        .filter(Boolean)
);

const McpServerEnvSchema = z.object({
    NMM_MCP_PORT: z.preprocess((value) => (value === undefined || value === "" ? "3002" : value), NumberEnvSchema),
    NMM_MCP_API_BASE_URL: z
        .preprocess(
            (value) => (value === undefined || value === "" ? "http://localhost:3000/api" : value),
            RequiredStringSchema
        )
        .transform((value) => value.replace(/\/$/, "")),
    NMM_MCP_BEARER_TOKEN: RequiredStringSchema,
    NMM_MCP_ALLOWED_ORIGINS: z.preprocess(
        (value) =>
            value === undefined || value === ""
                ? "http://localhost:5173,http://127.0.0.1:5173,http://localhost:6274,http://127.0.0.1:6274"
                : value,
        OriginListSchema
    ),
    NMM_MCP_REQUEST_TIMEOUT_MS: z.preprocess(
        (value) => (value === undefined || value === "" ? "5000" : value),
        NumberEnvSchema
    )
});

loadMcpEnvFile();

const parsedEnv = McpServerEnvSchema.parse(process.env);

export const mcpServerEnv: McpServerEnv = {
    port: parsedEnv.NMM_MCP_PORT,
    apiBaseUrl: parsedEnv.NMM_MCP_API_BASE_URL,
    bearerToken: parsedEnv.NMM_MCP_BEARER_TOKEN,
    allowedOrigins: parsedEnv.NMM_MCP_ALLOWED_ORIGINS,
    requestTimeoutMs: parsedEnv.NMM_MCP_REQUEST_TIMEOUT_MS
};

function loadMcpEnvFile() {
    const envFilePath = process.env.NMM_ENV_FILE ? resolveEnvFilePath(process.env.NMM_ENV_FILE) : defaultEnvFilePath;

    config({ path: envFilePath, override: false });
}

function resolveEnvFilePath(envFilePath: string) {
    if (path.isAbsolute(envFilePath)) {
        return envFilePath;
    }

    return path.resolve(workspaceRoot, envFilePath);
}
