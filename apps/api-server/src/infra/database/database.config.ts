import type { TypeOrmModuleOptions } from "@nestjs/typeorm";
import { CreateAuthTables1710000000000, CreateExampleItems1710000000001 } from "../../features/auth/database";
import { serverEnv } from "../env";

export function createTypeOrmOptions(): TypeOrmModuleOptions {
    const { database } = serverEnv;

    return {
        type: "postgres",
        autoLoadEntities: true,
        synchronize: database.synchronize,
        migrationsRun: database.migrationsRun,
        migrations: [CreateAuthTables1710000000000, CreateExampleItems1710000000001],
        logging: database.logging,
        host: database.host,
        port: database.port,
        username: database.username,
        password: database.password,
        database: database.database
    };
}
