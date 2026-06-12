import { z } from "zod";
import type { DatabaseEnv } from "../database";
import { loadServerEnv } from "./env-file";

export type AppEnv = {
    port: number;
    webOrigin: string;
    nodeEnv: string;
};

export type ServerEnv = {
    app: AppEnv;
    database: DatabaseEnv;
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
    NMM_DB_SYNCHRONIZE: BooleanEnvSchema,
    NMM_DB_LOGGING: BooleanEnvSchema
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
            synchronize: env.NMM_DB_SYNCHRONIZE,
            logging: env.NMM_DB_LOGGING
        }
    };
}

loadServerEnv();

export const serverEnv: ServerEnv = createServerEnv();
