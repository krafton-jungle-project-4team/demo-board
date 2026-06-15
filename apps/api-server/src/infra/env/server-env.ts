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
};

export type TmapEnv = {
    appKey?: string;
    baseUrl: string;
    timeoutMs: number;
    walkRouteCacheTtlSeconds: number;
    transportPoiCacheTtlSeconds: number;
    maxTmapCallsPerRequest: number;
};

export type ServerEnv = {
    app: AppEnv;
    auth: AuthEnv;
    ai: AiEnv;
    tmap: TmapEnv;
    database: DatabaseEnv;
};

const RequiredStringSchema = z.string().min(1);
const NumberEnvSchema = RequiredStringSchema.transform(Number).pipe(z.number().finite());
const OptionalNumberEnvSchema = z.preprocess((value) => {
    if (value === undefined || value === "") {
        return undefined;
    }

    return value;
}, NumberEnvSchema.optional());
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
    NMM_OPENAI_BASE_URL: OptionalStringSchema,
    OPENAI_API_KEY: OptionalStringSchema,
    NMM_TMAP_APP_KEY: OptionalStringSchema,
    NMM_TMAP_BASE_URL: OptionalStringSchema,
    NMM_TMAP_TIMEOUT_MS: OptionalNumberEnvSchema,
    NMM_TMAP_WALK_ROUTE_CACHE_TTL_SECONDS: OptionalNumberEnvSchema,
    NMM_TMAP_TRANSPORT_POI_CACHE_TTL_SECONDS: OptionalNumberEnvSchema,
    NMM_TMAP_MAX_CALLS_PER_REQUEST: OptionalNumberEnvSchema
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
            }
        },
        tmap: {
            appKey: env.NMM_TMAP_APP_KEY,
            baseUrl: env.NMM_TMAP_BASE_URL ?? "https://apis.openapi.sk.com",
            timeoutMs: env.NMM_TMAP_TIMEOUT_MS ?? 5000,
            walkRouteCacheTtlSeconds: env.NMM_TMAP_WALK_ROUTE_CACHE_TTL_SECONDS ?? 60 * 60 * 24 * 7,
            transportPoiCacheTtlSeconds: env.NMM_TMAP_TRANSPORT_POI_CACHE_TTL_SECONDS ?? 60 * 60,
            maxTmapCallsPerRequest: env.NMM_TMAP_MAX_CALLS_PER_REQUEST ?? 10
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
