import { Injectable, type OnModuleInit } from "@nestjs/common";
import { DataSource } from "typeorm";
import { POST_QUERY_COLUMNS, POST_QUERY_TABLES, POST_QUERY_TRIGRAM_INDEXES } from "./post-query-database.contract";

@Injectable()
export class PostQueryDatabaseInitializer implements OnModuleInit {
    constructor(private readonly dataSource: DataSource) {}

    async onModuleInit() {
        await this.dataSource.query("CREATE EXTENSION IF NOT EXISTS pg_trgm");
        await this.createIndexIfTableExists(
            POST_QUERY_TABLES.posts,
            `CREATE INDEX IF NOT EXISTS ${POST_QUERY_TRIGRAM_INDEXES.postTitle}
             ON ${POST_QUERY_TABLES.posts}
             USING gin (${POST_QUERY_COLUMNS.posts.title} gin_trgm_ops)`
        );
        await this.createIndexIfTableExists(
            POST_QUERY_TABLES.posts,
            `CREATE INDEX IF NOT EXISTS ${POST_QUERY_TRIGRAM_INDEXES.postContent}
             ON ${POST_QUERY_TABLES.posts}
             USING gin (${POST_QUERY_COLUMNS.posts.content} gin_trgm_ops)`
        );
        await this.createIndexIfTableExists(
            POST_QUERY_TABLES.tags,
            `CREATE INDEX IF NOT EXISTS ${POST_QUERY_TRIGRAM_INDEXES.tagName}
             ON ${POST_QUERY_TABLES.tags}
             USING gin (${POST_QUERY_COLUMNS.tags.name} gin_trgm_ops)`
        );
    }

    private async createIndexIfTableExists(tableName: string, createIndexSql: string) {
        const tableExists = await this.tableExists(tableName);

        if (!tableExists) {
            return;
        }

        await this.dataSource.query(createIndexSql);
    }

    private async tableExists(tableName: string) {
        const [row] = (await this.dataSource.query("SELECT to_regclass($1) IS NOT NULL AS exists", [
            tableName
        ])) as Array<{ exists: boolean }>;

        return row?.exists === true;
    }
}
