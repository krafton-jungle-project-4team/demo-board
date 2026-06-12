import { Injectable } from "@nestjs/common";
import { PostListItemSchema, type PostListItem, type PostListQuery } from "@nmm/shared";
import { DataSource } from "typeorm";
import { POST_QUERY_COLUMNS, POST_QUERY_TABLES } from "./post-query-database.contract";

const POST_LIST_EXCERPT_LENGTH = 160;

type PostListRow = {
    id: string;
    title: string;
    content: string;
    tags: string[] | null;
    created_at: Date | string;
};

type PostListCountRow = {
    total_count: string;
};

const postTagsCteSql = `
WITH post_tag_names AS (
    SELECT
        ${POST_QUERY_TABLES.postTags}.${POST_QUERY_COLUMNS.postTags.postId} AS post_id,
        COALESCE(
            array_agg(DISTINCT ${POST_QUERY_TABLES.tags}.${POST_QUERY_COLUMNS.tags.name} ORDER BY ${POST_QUERY_TABLES.tags}.${POST_QUERY_COLUMNS.tags.name})
                FILTER (WHERE ${POST_QUERY_TABLES.tags}.${POST_QUERY_COLUMNS.tags.name} IS NOT NULL),
            ARRAY[]::text[]
        ) AS tags,
        COALESCE(
            string_agg(DISTINCT ${POST_QUERY_TABLES.tags}.${POST_QUERY_COLUMNS.tags.name}, ' '),
            ''
        ) AS tag_text
    FROM ${POST_QUERY_TABLES.postTags}
    JOIN ${POST_QUERY_TABLES.tags}
        ON ${POST_QUERY_TABLES.tags}.${POST_QUERY_COLUMNS.tags.id} = ${POST_QUERY_TABLES.postTags}.${POST_QUERY_COLUMNS.postTags.tagId}
    GROUP BY ${POST_QUERY_TABLES.postTags}.${POST_QUERY_COLUMNS.postTags.postId}
)
`;

const postSearchWhereSql = `
WHERE (
    $1::text IS NULL
    OR ${POST_QUERY_TABLES.posts}.${POST_QUERY_COLUMNS.posts.title} % $1
    OR ${POST_QUERY_TABLES.posts}.${POST_QUERY_COLUMNS.posts.content} % $1
    OR COALESCE(post_tag_names.tag_text, '') % $1
)
`;

@Injectable()
export class PostListQueryRepository {
    constructor(private readonly dataSource: DataSource) {}

    async findPostList(query: PostListQuery): Promise<{ items: PostListItem[]; totalItems: number }> {
        const hasRequiredTables = await this.hasRequiredTables();

        if (!hasRequiredTables) {
            return {
                items: [],
                totalItems: 0
            };
        }

        const offset = (query.page - 1) * query.pageSize;
        const keyword = query.q ?? null;
        const [countRows, rows] = await Promise.all([
            this.dataSource.query(this.createCountSql(), [keyword]) as Promise<PostListCountRow[]>,
            this.dataSource.query(this.createListSql(), [keyword, query.pageSize, offset]) as Promise<PostListRow[]>
        ]);
        const totalItems = Number(countRows[0]?.total_count ?? 0);
        const items = rows.map(toPostListItem);

        return {
            items,
            totalItems
        };
    }

    private async hasRequiredTables() {
        const requiredTableNames = Object.values(POST_QUERY_TABLES);
        const rows = (await this.dataSource.query(
            `
            SELECT bool_and(to_regclass(table_name) IS NOT NULL) AS ready
            FROM unnest($1::text[]) AS table_name
            `,
            [requiredTableNames]
        )) as Array<{ ready: boolean | null }>;

        return rows[0]?.ready === true;
    }

    private createCountSql() {
        return `
        ${postTagsCteSql}
        SELECT COUNT(*)::text AS total_count
        FROM ${POST_QUERY_TABLES.posts}
        LEFT JOIN post_tag_names
            ON post_tag_names.post_id = ${POST_QUERY_TABLES.posts}.${POST_QUERY_COLUMNS.posts.id}
        ${postSearchWhereSql}
        `;
    }

    private createListSql() {
        return `
        ${postTagsCteSql}
        SELECT
            ${POST_QUERY_TABLES.posts}.${POST_QUERY_COLUMNS.posts.id}::text AS id,
            ${POST_QUERY_TABLES.posts}.${POST_QUERY_COLUMNS.posts.title} AS title,
            ${POST_QUERY_TABLES.posts}.${POST_QUERY_COLUMNS.posts.content} AS content,
            ${POST_QUERY_TABLES.posts}.${POST_QUERY_COLUMNS.posts.createdAt} AS created_at,
            COALESCE(post_tag_names.tags, ARRAY[]::text[]) AS tags,
            CASE
                WHEN $1::text IS NULL THEN 0
                ELSE GREATEST(
                    similarity(${POST_QUERY_TABLES.posts}.${POST_QUERY_COLUMNS.posts.title}, $1),
                    similarity(${POST_QUERY_TABLES.posts}.${POST_QUERY_COLUMNS.posts.content}, $1),
                    similarity(COALESCE(post_tag_names.tag_text, ''), $1)
                )
            END AS search_rank
        FROM ${POST_QUERY_TABLES.posts}
        LEFT JOIN post_tag_names
            ON post_tag_names.post_id = ${POST_QUERY_TABLES.posts}.${POST_QUERY_COLUMNS.posts.id}
        ${postSearchWhereSql}
        ORDER BY
            CASE WHEN $1::text IS NULL THEN NULL ELSE search_rank END DESC,
            ${POST_QUERY_TABLES.posts}.${POST_QUERY_COLUMNS.posts.createdAt} DESC,
            ${POST_QUERY_TABLES.posts}.${POST_QUERY_COLUMNS.posts.id} DESC
        LIMIT $2
        OFFSET $3
        `;
    }
}

function toPostListItem(row: PostListRow): PostListItem {
    return PostListItemSchema.parse({
        id: Number(row.id),
        title: row.title,
        excerpt: createExcerpt(row.content),
        tags: row.tags ?? [],
        createdAt: toIsoString(row.created_at)
    });
}

function createExcerpt(content: string) {
    const normalizedContent = content.replace(/\s+/g, " ").trim();

    if (normalizedContent.length <= POST_LIST_EXCERPT_LENGTH) {
        return normalizedContent;
    }

    return `${normalizedContent.slice(0, POST_LIST_EXCERPT_LENGTH)}...`;
}

function toIsoString(value: Date | string) {
    if (value instanceof Date) {
        return value.toISOString();
    }

    return new Date(value).toISOString();
}
