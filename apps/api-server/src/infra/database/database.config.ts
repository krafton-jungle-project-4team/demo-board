import type { TypeOrmModuleOptions } from "@nestjs/typeorm";
import { serverEnv } from "../env";

export function createTypeOrmOptions(): TypeOrmModuleOptions {
    const { database } = serverEnv;

    return {
        type: "postgres",
        autoLoadEntities: true,
        synchronize: database.synchronize,
        migrationsRun: false,
        logging: database.logging,
        host: database.host,
        port: database.port,
        username: database.username,
        password: database.password,
        database: database.database
    };
}
