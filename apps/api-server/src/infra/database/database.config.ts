import type { TypeOrmModuleOptions } from "@nestjs/typeorm";
import { serverEnv } from "../env";

export function createTypeOrmOptions(): TypeOrmModuleOptions {
    const { database } = serverEnv;

    return {
        type: "postgres" as const,
        autoLoadEntities: true,
        synchronize: false,
        logging: database.logging,
        manualInitialization: database.manualInitialization,
        host: database.host,
        port: database.port,
        username: database.username,
        password: database.password,
        database: database.database
    };
}
