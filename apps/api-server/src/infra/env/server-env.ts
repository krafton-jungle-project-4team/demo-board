import { z } from "zod";
import type { DatabaseEnv } from "../database";
import { loadServerEnv } from "./env-file";

export type AppEnv = {
    port: number;
    webOrigin: string;
    nodeEnv: string;
};

export type AuthEnv = {
    secret: string;
    baseUrl: string;
};

export type AiEnv = {
    embedding: {
        provider: "openai";
        openAiApiKey?: string;
        openAiBaseUrl: string;
        model: string;
        dimensions: number;
    };
    moderation: {
        provider: "openai";
        openAiApiKey?: string;
        openAiBaseUrl: string;
        model: string;
    };
};

export type ServerEnv = {
    app: AppEnv;
    auth: AuthEnv;
    ai: AiEnv;
    database: DatabaseEnv;
};

const RequiredStringSchema = z.string().min(1);
const NumberEnvSchema = RequiredStringSchema.transform(Number).pipe(z.number().finite());
const BooleanEnvSchema = z.stringbool({ truthy: ["true"], falsy: ["false"], case: "sensitive" });
const OptionalStringSchema = z.preprocess((value) => {
    if (typeof value !== "string") {
        return undefined;
    }

    const trimmedValue = value.trim();

    return trimmedValue.length > 0 ? trimmedValue : undefined;
}, z.string().min(1).optional());
const EmbeddingProviderSchema = z.preprocess(
    (value) => (value === undefined || value === "" ? "openai" : value),
    z.literal("openai")
);
const EmbeddingDimensionsSchema = z.preprocess(
    (value) => (value === undefined || value === "" ? "1536" : value),
    NumberEnvSchema.pipe(z.number().int().positive())
);

const ServerEnvSchema = z.object({
    PORT: NumberEnvSchema,
    NODE_ENV: RequiredStringSchema,
    NMM_WEB_ORIGIN: RequiredStringSchema,
    NMM_AUTH_SECRET: RequiredStringSchema,
    NMM_AUTH_BASE_URL: RequiredStringSchema,
    NMM_DB_HOST: RequiredStringSchema,
    NMM_DB_PORT: NumberEnvSchema,
    NMM_DB_USERNAME: RequiredStringSchema,
    NMM_DB_PASSWORD: RequiredStringSchema,
    NMM_DB_DATABASE: RequiredStringSchema,
    NMM_DB_SYNCHRONIZE: BooleanEnvSchema,
    NMM_DB_LOGGING: BooleanEnvSchema,
    NMM_EMBEDDING_PROVIDER: EmbeddingProviderSchema,
    NMM_EMBEDDING_MODEL: z.string().min(1).default("text-embedding-3-small"),
    NMM_EMBEDDING_DIMENSIONS: EmbeddingDimensionsSchema,
    NMM_MODERATION_MODEL: z.string().min(1).default("gpt-4.1-mini"),
    NMM_OPENAI_BASE_URL: OptionalStringSchema,
    OPENAI_API_KEY: OptionalStringSchema
});

function createServerEnv(): ServerEnv {
    const env = ServerEnvSchema.parse(process.env);

    return {
        app: {
            port: env.PORT,
            webOrigin: env.NMM_WEB_ORIGIN,
            nodeEnv: env.NODE_ENV
        },
        auth: {
            secret: env.NMM_AUTH_SECRET,
            baseUrl: env.NMM_AUTH_BASE_URL
        },
        ai: {
            embedding: {
                provider: env.NMM_EMBEDDING_PROVIDER,
                openAiApiKey: env.OPENAI_API_KEY,
                openAiBaseUrl: env.NMM_OPENAI_BASE_URL ?? "https://api.openai.com/v1",
                model: env.NMM_EMBEDDING_MODEL,
                dimensions: env.NMM_EMBEDDING_DIMENSIONS
            },
            moderation: {
                provider: "openai",
                openAiApiKey: env.OPENAI_API_KEY,
                openAiBaseUrl: env.NMM_OPENAI_BASE_URL ?? "https://api.openai.com/v1",
                model: env.NMM_MODERATION_MODEL
            }
        },
        database: {
            host: env.NMM_DB_HOST,
            port: env.NMM_DB_PORT,
            username: env.NMM_DB_USERNAME,
            password: env.NMM_DB_PASSWORD,
            database: env.NMM_DB_DATABASE,
            synchronize: env.NMM_DB_SYNCHRONIZE,
            logging: env.NMM_DB_LOGGING
        }
    };
}

loadServerEnv();

export const serverEnv: ServerEnv = createServerEnv();
