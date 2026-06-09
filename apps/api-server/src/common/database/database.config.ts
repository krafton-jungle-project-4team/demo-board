import type { TypeOrmModuleOptions } from "@nestjs/typeorm";

export function createTypeOrmOptions(): TypeOrmModuleOptions {
  const baseOptions = {
    type: "postgres" as const,
    autoLoadEntities: true,
    synchronize: readBooleanEnv("NMM_DB_SYNCHRONIZE", process.env.NODE_ENV !== "production"),
    logging: readBooleanEnv("NMM_DB_LOGGING", false),
    manualInitialization: readBooleanEnv("NMM_DB_MANUAL_INITIALIZATION", false)
  };
  const databaseUrl = process.env.DATABASE_URL;

  if (databaseUrl) {
    return {
      ...baseOptions,
      url: databaseUrl
    };
  }

  return {
    ...baseOptions,
    host: process.env.NMM_DB_HOST ?? "localhost",
    port: readNumberEnv("NMM_DB_PORT", 5432),
    username: process.env.NMM_DB_USERNAME ?? "namanmu",
    password: process.env.NMM_DB_PASSWORD ?? "1234",
    database: process.env.NMM_DB_DATABASE ?? "namanmu"
  };
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
