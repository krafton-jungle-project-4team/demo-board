export type DatabaseEnv = {
    host: string;
    port: number;
    username: string;
    password: string;
    database: string;
    synchronize: boolean;
    migrationsRun: boolean;
    logging: boolean;
};
